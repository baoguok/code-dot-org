// This file contains a generic ProgressManager which any lab can include,
// if it wants to make progress without reloading the page.

// Abstract class that validates a set of conditions. How
// the validation works is up to the implementor.
export abstract class Validator {
  abstract shouldCheckConditions(): boolean;
  abstract checkConditions(): void;
  abstract conditionsMet(conditions: string[]): boolean;
  abstract clear(): void;
}

// A validation inside the progression.
interface Validation {
  conditions: string[];
  message: string;
  next: boolean;
}

// The definition of the progression.
interface Progression extends Object {
  panels: {
    text: string;
    toolbox: {
      [key: string]: string;
    };
    sounds: {
      [key: string]: string;
    };
    validations: Validation[];
  }[];
}

// The current progress state.
interface ProgressState {
  step: number;
  satisfied: boolean;
  message?: string | null;
}

export default class ProgressManager {
  private progression: Progression;
  private validator: Validator;
  private onProgressChange: (state: ProgressState) => void;
  private currentProgressState: ProgressState;

  constructor(
    progression: Progression,
    validator: Validator,
    onProgressChange: (state: ProgressState) => void
  ) {
    this.progression = progression;
    this.validator = validator;
    this.onProgressChange = onProgressChange;
    this.currentProgressState = {
      step: 0,
      satisfied: false,
      message: null
    };
  }

  getProgression() {
    return this.progression;
  }

  getCurrentState() {
    return this.currentProgressState;
  }

  getCurrentToolbox() {
    return this.progression.panels[this.currentProgressState.step].toolbox;
  }

  getCurrentSounds() {
    return this.progression.panels[this.currentProgressState.step].sounds;
  }

  updateProgress(): void {
    const validations = this.progression.panels[this.currentProgressState.step]
      .validations;

    if (!validations) {
      return;
    }

    // Find out from the lab-specific code whether we should be trying to
    // check conditions at the moment.  Otherwise, we might get a fail
    // when we shouldn't have even been checking.
    if (!this.validator.shouldCheckConditions()) {
      return;
    }

    // Give the lab-specific code a chance to check conditions.  We do
    // it once each update in case it's expensive, and since conditions
    // can be used by multiple validations.
    this.validator.checkConditions();

    // Go through each validation to see if we have a match.
    for (const validation of validations) {
      if (validation.conditions) {
        // Ask the lab-specific validator if this validation's
        // conditions are met.
        if (this.validator.conditionsMet(validation.conditions)) {
          this.currentProgressState.satisfied = validation.next;
          this.currentProgressState.message = validation.message;
          this.onProgressChange(this.currentProgressState);
          return;
        }
      } else {
        this.currentProgressState.message = validation.message;
      }
    }

    this.onProgressChange(this.currentProgressState);
  }

  // Advance to the next step.  Advances the state internally and calls
  // the change handler.
  next(): void {
    // Give the lab the chance to clear accumulated satisfied conditions.
    this.validator.clear();

    this.currentProgressState.step++;
    this.currentProgressState.satisfied = false;
    this.currentProgressState.message = null;

    this.onProgressChange(this.currentProgressState);
  }
}
