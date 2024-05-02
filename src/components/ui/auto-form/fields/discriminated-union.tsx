import { FormField } from "@/components/ui/form";
import { useForm, useFormContext } from "react-hook-form";
import * as z from "zod";
import { Dependency, FieldConfig, FieldConfigItem } from "../types";
import { beautifyObjectName, getBaseType, zodToHtmlInputProps } from "../utils";
import resolveDependencies from "../dependencies";
import AutoFormEnum from "./enum";
import AutoFormObject from "./object";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AutoFormDiscriminatedUnion<
  SchemaType extends z.ZodDiscriminatedUnion<any, any>,
>({
  schema,
  form,
  fieldConfig,
  path = [],
  dependencies = [],
}: {
  schema: SchemaType | z.ZodEffects<SchemaType>;
  form: ReturnType<typeof useForm>;
  fieldConfig?: FieldConfig<z.infer<SchemaType>>;
  path?: string[];
  dependencies?: Dependency<z.infer<SchemaType>>[];
}) {
  const { watch } = useFormContext(); // Use useFormContext to access the watch function

  if (!schema) {
    return null;
  }

  const discriminator = schema._def.discriminator;

  const options_literal = schema._def.options
    .map((option) => option.shape[discriminator])
    .map((option) => option._def.value);

  const options_enum = z.enum(options_literal);

  const handleIfZodNumber = (item: z.ZodAny) => {
    const isZodNumber = (item as any)._def.typeName === "ZodNumber";
    const isInnerZodNumber =
      (item._def as any).innerType?._def?.typeName === "ZodNumber";

    if (isZodNumber) {
      (item as any)._def.coerce = true;
    } else if (isInnerZodNumber) {
      (item._def as any).innerType._def.coerce = true;
    }

    return item;
  };

  let name = discriminator;
  let item = options_enum;
  item = handleIfZodNumber(item) as z.ZodAny;
  const zodBaseType = getBaseType(item);
  const itemName = item._def.description ?? beautifyObjectName(name);
  const key = [...path, name].join(".");
  const {
    isHidden,
    isDisabled,
    isRequired: isRequiredByDependency,
    overrideOptions,
  } = resolveDependencies(dependencies, name, watch);

  if (isHidden) {
    return null;
  }

  const fieldConfigItem: FieldConfigItem = fieldConfig?.[name] ?? {};
  const zodInputProps = zodToHtmlInputProps(item);
  const isRequired =
    isRequiredByDependency ||
    zodInputProps.required ||
    fieldConfigItem.inputProps?.required ||
    false;
  if (overrideOptions) {
    item = z.enum(overrideOptions) as unknown as z.ZodAny;
  }

  return (
    <Accordion type="multiple" className="space-y-5 border-none">
      <FormField
        control={form.control}
        name={key}
        key={key}
        render={({ field }) => {
          const defaultValue = fieldConfigItem.inputProps?.defaultValue;

          const value = field.value ?? defaultValue ?? "";

          const _object = schema._def.optionsMap.get(value);

          const fieldProps = {
            ...zodToHtmlInputProps(item),
            ...field,
            ...fieldConfigItem.inputProps,
            disabled: fieldConfigItem.inputProps?.disabled || isDisabled,
            ref: undefined,
            value: value,
          };

          return (
            <AccordionItem value={name} key={key} className="border-none">
              <AccordionTrigger>{itemName}</AccordionTrigger>
              <AccordionContent className="p-2">
                <AutoFormEnum
                  zodInputProps={zodInputProps}
                  field={field}
                  fieldConfigItem={fieldConfigItem}
                  label={itemName}
                  isRequired={isRequired}
                  zodItem={item}
                  fieldProps={fieldProps}
                  className={fieldProps.className}
                />

                {value && _object ? (
                  <AutoFormObject
                    schema={_object as z.ZodObject<any, any>}
                    form={form}
                    fieldConfig={fieldConfig}
                    path={path}
                  />
                ) : null}
              </AccordionContent>
            </AccordionItem>
          );
        }}
      />
    </Accordion>
  );
}
