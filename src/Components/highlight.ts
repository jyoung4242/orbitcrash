import { Vector } from "@peasy-lib/peasy-viewport";
import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IHighlightComponent {
  data: HighlightType;
}
export type HighlightType = Array<{
  src: string;
  offset: Vector;
  size: Vector;
}>;

// this is the exported interface that is used in systems modules
export interface HighlightComponent {
  highlights: HighlightType;
}

export class HighlightComp extends Component {
  // UI template string literal with UI binding of value property
  public template = `
    <style>
        .highlight-component{
            display: block;
            position: absolute;
            top:0;
            left:0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            box-shadow: 0px 0px 10px 1px \${value.color}\${value.opacity};
        }
    </style>
    <highlights-layer \${===value.enabled} class="highlight-component"></highlights-layer>
    `;

  //setting default value
  public value: HighlightType = [];
  public constructor() {
    //@ts-ignore
    super("highlight", HighlightComp, true);
  }

  public define(data: IHighlightComponent): void {
    if (data == null) {
      return;
    }
    this.value = data.data;
  }
}
