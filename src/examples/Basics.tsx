import AutoForm, { AutoFormSubmit } from "../components/ui/auto-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { TableSchema } from "@data-root/types";

function Basics() {
  return (
    <>
      <div className="max-w-lg mx-auto my-6">
        <Card>
          <CardHeader>
            <CardTitle>AutoForm Example</CardTitle>
            <CardDescription>
              Automatically generate a form from a Zod schema.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AutoForm formSchema={TableSchema} onSubmit={console.log}>
              <AutoFormSubmit>Send now</AutoFormSubmit>
            </AutoForm>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default Basics;
