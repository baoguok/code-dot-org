import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import {FormGroup, Button} from 'react-bootstrap';
import FieldGroup from '../code-studio/pd/form_components/FieldGroup';
import SingleCheckbox from '../code-studio/pd/form_components/SingleCheckbox';
import SchoolAutocompleteDropdownWithLabel from '@cdo/apps/templates/census2017/SchoolAutocompleteDropdownWithLabel';
import ValidationStep, {Status} from '@cdo/apps/lib/ui/ValidationStep';

const styles = {
  intro: {
    paddingBottom: 10
  }
};

export class AmazonFutureEngineerEligibility extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      schoolEligible: null,
      consent: false,
      email: ''
    };
  }

  // Make this a real handleChange
  handleChange = change => {
    this.setState(change);
  };

  // make this a real submit
  submit = () => {
    // const params = {
    // get real params
    // };

    // use (or remove) submitting state
    this.setState({
      schoolEligible: true
    });
  };

  handleSchoolDropdownChange = (field, event) => {
    this.setState({
      schoolId: event ? event.value : '',
      schoolName: event ? event.label : ''
    });
  };

  render() {
    // update ID and classname appropriately
    // should separate this little form group out into its own component (like DiscountCodeSchoolChoice)
    return (
      <div>
        {this.state.schoolEligible === null && (
          <div>
            <h2>Am I eligible?</h2>
            <FormGroup id="amazon-future-engineer-eligiblity-intro">
              <div style={styles.intro}>
                Enter your teacher email address and select your school below to
                find out if you're eligible to participate in the Amazon Future
                Engineer program, which offers free support for participating
                Code.org classrooms.
              </div>
              <FieldGroup
                id="email"
                label="Email"
                type="text"
                required={false}
                onChange={this.handleChange}
              />
              <SchoolAutocompleteDropdownWithLabel
                setField={this.handleSchoolDropdownChange}
                showRequiredIndicator={true}
                value={this.state.schoolId}
              />
              <Button id="submit" onClick={this.submit}>
                Find out if I'm eligible
              </Button>
            </FormGroup>
          </div>
        )}
        {this.state.schoolEligible === true && this.state.consent === false && (
          <AmazonFutureEngineerForm
            email={this.state.email}
            schoolId={this.state.schoolId}
            onContinue={this.handleChange}
          />
        )}
        {this.state.schoolEligible !== null && this.state.consent === true && (
          <AmazonFutureEngineerAccountConfirmation />
        )}
      </div>
    );
  }
}

class AmazonFutureEngineerForm extends React.Component {
  static propTypes = {
    email: PropTypes.string,
    schoolId: PropTypes.string,
    onContinue: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      email: this.props.email,
      inspirationKit: false,
      csta: false,
      awsEducate: false,
      consent: false
    };
  }

  handleChange = change => {
    this.setState(change);
  };

  // make this a real submit
  submit = () => {
    const stateChange = _.pick(this.state, [
      'firstName',
      'lastName',
      'inspirationKit',
      'csta',
      'awsEducate',
      'consent',
      'street1',
      'street2',
      'city',
      'state',
      'zip'
    ]);

    this.props.onContinue(stateChange);
  };

  // need to control values with react
  // add checkbox saying "you teach at eligible school" at top
  render() {
    return (
      <div>
        <div>
          <div>
            <ValidationStep
              stepStatus={Status.SUCCEEDED}
              stepName="You teach at an eligible school!"
            />
            We invite you to enroll in the Amazon Future Engineer program by
            completing the information below.
          </div>
          <form>
            <FieldGroup
              id="email"
              label="Email"
              type="text"
              required={true}
              onChange={this.handleChange}
              defaultValue={this.props.email}
            />
            <SchoolAutocompleteDropdownWithLabel
              setField={this.handleDropdownChange}
              showRequiredIndicator={true}
              value={this.props.schoolId}
            />
            <FieldGroup
              id="first_name"
              label="First name"
              type="text"
              required={true}
              onChange={this.handleChange}
              defaultValue={'ben'}
            />
            <FieldGroup
              id="last_name"
              label="Last name"
              type="text"
              required={true}
              onChange={this.handleChange}
              defaultValue={'brooks'}
            />
            <div>
              How can Amazon Future Engineer help you grow computer science at
              your school?
            </div>
            <hr />
            <SingleCheckbox
              name="inspirationKit"
              label="Send my school an Inspiration Kit with posters and stickers to
              help promote computer science to students and parents."
              onChange={this.handleChange}
              value={this.state.inspirationKit}
            />
            {this.state.inspirationKit && (
              <ShippingAddressFormGroup handleChange={this.handleChange} />
            )}
            <SingleCheckbox
              name="csta"
              label="Send me a free annual Computer Science Teachers Association (CSTA)
              Plus membership - which includes access to Amazon expert-led
              webinars and other exclusive content."
              onChange={this.handleChange}
              value={this.state.csta}
            />
            <SingleCheckbox
              name="awsEducate"
              label="Send me a free membership to Amazon Web Services Educate to access
              free content and cloud computing credits to help my students learn
              to build in the cloud."
              onChange={this.handleChange}
              value={this.state.awsEducate}
            />
            <hr />
            <SingleCheckbox
              name="consent"
              label="I give Code.org permission to share my name, email address, and
              school name, address, and ID with Amazon.com (required to
              participate). Use of your personal information is subject to
              Amazon’s Privacy Policy."
              onChange={this.handleChange}
              value={this.state.consent}
              required={true}
            />
            <div>
              By clicking Continue, you will receive an email from Amazon Future
              Engineer to claim your benefits. You will also receive occasional
              emails from Amazon Future Engineer about new opportunities. You
              always have the choice to adjust your interest settings or
              unsubscribe.
            </div>
            <Button id="continue" onClick={this.submit}>
              Continue
            </Button>
          </form>
        </div>
      </div>
    );
  }
}

export class AmazonFutureEngineerAccountConfirmation extends React.Component {
  render() {
    return (
      <div>
        <h2>Almost done!</h2>
        <div>
          Thank you for completing your application information for the Amazon
          Future Engineer program. To finalize your participation and start
          receiving benefits, sign up for a Code.org account, or sign in if you
          already have one.
        </div>
        <div>Already have a Code.org account? Sign in.</div>
        <Button id="sign_up" onClick={() => {}}>
          Sign up
        </Button>
      </div>
    );
  }
}

export class ShippingAddressFormGroup extends React.Component {
  render() {
    // Maybe outermost element should be FormGroup, not div
    return (
      <div>
        <FieldGroup
          id="street_1"
          label="Street 1"
          type="text"
          required={true}
          onChange={this.handleChange}
          defaultValue={'500 Big Dog Salmon Way'}
        />
        <FieldGroup
          id="street_2"
          label="Street 2"
          type="text"
          required={false}
          onChange={this.handleChange}
        />
        <FieldGroup
          id="city"
          label="City"
          type="text"
          required={true}
          onChange={this.handleChange}
        />
        <FieldGroup
          id="state"
          label="State"
          type="text"
          required={true}
          onChange={this.handleChange}
        />
        <FieldGroup
          id="zip"
          label="Zip code"
          type="number"
          required={false}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}
