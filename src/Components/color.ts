import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IColorComponent {
  data: ColorType;
}
export type ColorType = string;

// this is the exported interface that is used in systems modules
export interface ColorComponent {
  color: ColorType;
}

export class ColorComp extends Component {
  public template = `
    <style>
      color-layer{
        position: absolute;
        top:0;
        left:0;
        width: 100%;
        height:100%;
        border-radius: 50%;
      }
    </style>
    <color-layer class="token" style="background-color: \${value}"></color-layer>
  `;
  //setting default value
  public value: ColorType = "";
  public constructor() {
    //@ts-ignore
    super("color", ColorComp, true);
  }

  public define(data: string): void {
    if (data == null) {
      return;
    }
    this.value = data;
  }
}
