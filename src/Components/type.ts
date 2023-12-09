import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface ITypeComponent {
  data: TypeType;
}
export type TypeType = string;

// this is the exported interface that is used in systems modules
export interface TypeComponent {
  type: TypeType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class TypeComp extends Component {
  public value: TypeType = "";
  public constructor() {
    //@ts-ignore
    super("type", TypeComp, true);
  }

  public define(data: string): void {
    if (data == null) {
      return;
    }
    this.value = data;
  }
}
