import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IMouseBoundComponent {
  data: MouseBoundType;
}
export type MouseBoundType = boolean;

// this is the exported interface that is used in systems modules
export interface MouseBoundComponent {
  mousebind: MouseBoundType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class MouseBoundComp extends Component {
  // UI template string literal with UI binding of value property

  //setting default value
  public value: MouseBoundType = false;
  public constructor() {
    //@ts-ignore
    super("mousebind", MouseBoundComp, true);
  }

  public define(data: IMouseBoundComponent): void {
    if (data == null) {
      return;
    }
    this.value = data.data;
  }
}
