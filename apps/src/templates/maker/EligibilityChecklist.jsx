/** @file Maker Discount Code Eligibility Checklist */
import React, {Component, PropTypes} from 'react';
import i18n from "@cdo/locale";
import Button from "../Button";
import ValidationStep, {Status} from '@cdo/apps/lib/ui/ValidationStep';
import DiscountCodeSchoolChoice from './DiscountCodeSchoolChoice';

const styles = {
  unit6Form: {
    marginTop: 15
  },
  question: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  radio: {
    margin: '0px 10px'
  },
  submit: {
    marginTop: 5
  }
};

export default class EligibilityChecklist extends Component {
  static propTypes = {
    statusPD: PropTypes.oneOf(Object.values(Status)).isRequired,
    statusStudentCount: PropTypes.oneOf(Object.values(Status)).isRequired,
    unit6Intention: PropTypes.string,
    schoolId: PropTypes.string,
    schoolName: PropTypes.string,
    hasConfirmedSchool: PropTypes.bool,
    getsFullDiscount: PropTypes.bool,
  };

  state = {
    statusYear: Status.UNKNOWN,
    yearChoice: null, // stores the teaching-year choice until submitted
    submitting: false,
    discountAmount: null,
  };

  constructor(props) {
    super(props);

    // If we had already submitted our intentions for unit 6, initialize component
    // state with that data
    if (props.unit6Intention) {
      this.state = {
        ...this.state,
        yearChoice: props.unit6Intention,
        statusYear: (props.unit6Intention === 'yes1718' ||
          props.unit6Intention === 'yes1819') ? Status.SUCCEEDED : Status.FAILED,
        discountAmount: props.hasConfirmedSchool ?
          (props.getsFullDiscount ? "$0" : "$97.50") : null
      };
    }
  }

  // Saves the teaching-year choice to trigger next step of actions
  handleSubmit = () => {
    this.setState({submitting: true});
    $.ajax({
     url: "/maker/apply",
     type: "post",
     dataType: "json",
     data: {
       unit_6_intention: this.state.yearChoice
     }
   }).done(data => {
     this.setState({
       statusYear: data.eligible ? Status.SUCCEEDED : Status.FAILED,
       submitting: false
     });
   }).fail((jqXHR, textStatus) => {
     // TODO: should probably introduce some error UI
     console.error(textStatus);
   });
  }

  handleSchoolConfirmed = (fullDiscount) => {
    this.setState({
      discountAmount: fullDiscount ? "$0" : "$97.50"
    });
  }

  handleChangeIntention = event => {
    this.setState({yearChoice: event.target.value});
  }

  render() {
    return (
      <div>
        <h2>
          {i18n.eligibilityRequirements()}
        </h2>
        <div>
          {i18n.eligibilityExplanation()}
        </div>
        <ValidationStep
          stepName={i18n.eligibilityReqPD()}
          stepStatus={this.props.statusPD}
        >
          {i18n.eligibilityReqPDFail()}
        </ValidationStep>
        <ValidationStep
          stepName={i18n.eligibilityReqStudentCount()}
          stepStatus={this.props.statusStudentCount}
        >
          {i18n.eligibilityReqStudentCountFail()}
        </ValidationStep>
        <ValidationStep
          stepName={i18n.eligibilityReqYear()}
          stepStatus={this.state.statusYear}
          alwaysShowChildren={true}
        >
          {this.props.statusStudentCount === Status.SUCCEEDED &&
              this.props.statusPD === Status.SUCCEEDED &&
            <div>
              {i18n.eligibilityReqYearFail()}
              <form style={styles.unit6Form}>
                <div style={styles.question}>
                  {i18n.eligibilityReqYearConfirmInstructions()}
                </div>
                {[
                  ['no', i18n.eligibilityYearNo()],
                  ['yes1718', i18n.eligibilityYearYes1718()],
                  ['yes1819', i18n.eligibilityYearYes1819()],
                  ['yesAfter', i18n.eligibilityYearAfter()],
                  ['unsure', i18n.eligibilityYearUnknown()],
                ].map(([value, description]) =>
                  <label key={value}>
                    <input
                      style={styles.radio}
                      type="radio"
                      name="year"
                      value={value}
                      checked={this.state.yearChoice === value}
                      onChange={this.handleChangeIntention}
                      disabled={this.state.statusYear !== Status.UNKNOWN}
                    />
                  {description}
                  </label>
                )}
                {/* Remove button after choice is made */}
                {this.state.statusYear === Status.UNKNOWN &&
                  <Button
                    style={styles.submit}
                    color="orange"
                    text={this.state.submitting ? i18n.submitting() : i18n.submit()}
                    onClick={this.handleSubmit}
                    disabled={this.state.submitting}
                  />
                }
              </form>
            </div>
          }
          {this.state.statusYear === Status.FAILED &&
            <div>{i18n.eligibilityYearDecline()}</div>
          }
        </ValidationStep>
        {this.state.statusYear === Status.SUCCEEDED &&
          <DiscountCodeSchoolChoice
            initialSchoolId={this.props.schoolId}
            initialSchoolName={this.props.schoolName}
            schoolConfirmed={this.props.hasConfirmedSchool}
            onSchoolConfirmed={this.handleSchoolConfirmed}
          />
        }
        {this.state.discountAmount  &&
          <Button
            color={Button.ButtonColor.orange}
            text={i18n.getCodePrice({price: this.state.discountAmount})}
            onClick={() => {}}
          />
        }
      </div>
    );
  }
}
