/*****************************************************************************
 * Component: Index
 * Parameters on entity:
 *  name: <'enity name'>,
 *
 * Description:
 * based on the parameters set on entity create method
 * a name property to the entity, useful if you have to find enitty in array
 ***************************************************************************** */
import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IIndexComponent {
  data: IndexType;
}
export type IndexType = number;

// this is the exported interface that is used in systems modules
export interface IndexComponent {
  index: IndexType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class IndexComp extends Component {
  // UI template string literal with UI binding of value property

  //setting default value
  public value: IndexType = 0;
  public constructor() {
    //@ts-ignore
    super("index", IndexComp, true);
  }

  public define(data: number): void {
    if (data == null) {
      return;
    }
    this.value = data;
  }
}
