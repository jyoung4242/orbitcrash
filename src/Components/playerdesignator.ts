import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IPlayerDesignatorComponent {
  data: PlayerDesignatorType;
}
export type PlayerDesignatorType = string;

// this is the exported interface that is used in systems modules
export interface PlayerDesignatorComponent {
  playerDesignator: PlayerDesignatorType;
}

export class PlayerDesignatorComp extends Component {
  //setting default value
  public value: PlayerDesignatorType = "";
  public constructor() {
    //@ts-ignore
    super("playerdesignator", PlayerDesignatorComp, true);
  }

  public define(data: string): void {
    if (data == null) {
      return;
    }
    this.value = data;
  }
}
