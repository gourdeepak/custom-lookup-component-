import { LightningElement, track, api, wire } from 'lwc';
import getRecords from '@salesforce/apex/LookUpController.fetchLookupData';
import selectedRecords from '@salesforce/apex/LookUpController.selectedValue';

export default class CustomLookup extends LightningElement {

    @api placeholder = 'Search'; /* This is a property that is used to set the placeholder value of the input box. */
    @api sobjectapiname = ''; // Getting Object Api name from the parent component.
    @api queryfieldname = ''; // Getting field label name from the parent component.
    @api icon = ''; // Getting icon name from the parent component.
    @api strrequired = false; // Getting required type from the parent component.
    @api labelname = 'Custom lookup'; // Getting field label name from the parent component.
    @api recordtype = '';   // Getting record type id from the parent component.
    @api strvalue = ''; // Getting field value from the parent component.
    @api disabled = false; // Getting field disabled value from the parent component.
    @track strDisabled = false;
    @track search = '';
    @track selectedValue = '';
    error;
    @track selectedName = '';
    isValueSelected;
    isInvalid = false;
    isInvalidSelect = false;
    blurTimeout;
    @track records;
    @track hasRecords = true;
    /* This is a property that is used to set the class of the input box. */
    @track boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    @track inputClass = '';
    /**
     * Get records based on searched value.
     * This is a wire method which is used to get the data from the apex class.
     * @type {String}
     */
    @wire(getRecords, { searchKey: '$search', sObjectApiName: '$sobjectapiname', qFieldName: '$queryfieldname', recordType: '$recordtype', strRecordId: '$strvalue' })
    recordData({ data, error }) {
        if (data) {
            this.records = JSON.parse(data).rcc;
            this.hasRecords = this.records.length == 0 ? false : true;
            if (this.hasRecords == false) {
                this.records = JSON.parse(data).results;
                this.hasRecords = this.records.length == 0 ? false : true;
            }
            // console.log('LookupRecords :' + JSON.stringfy(this.records));
        }
        else {
            this.error = error;
        }
    };
    /**
    * Initialize value on parent component load.
    * The connectedCallback() function is called when the element is inserted into the DOM
    */
    connectedCallback() {
        this.onLoad();
    }
    /**
     * The function is called when the component is loaded. It checks if the value is not null and not
     empty. If it is not null and not empty, it calls the Apex method selectedRecords to get the
     record details. If the value is null or empty, it sets the selectedValue and selectedName to
     empty strings
     */
    onLoad() {
        console.log('onLoad customLookUp ' + this.strvalue);
        if (this.strvalue != null && this.strvalue != '') {
            selectedRecords({ sObjectApiName: this.sobjectapiname, strRecordId: this.strvalue })
                .then(data => {
                    this.selectedValue = data.Id;
                    this.selectedName = data.Name;
                    if (this.selectedValue != null && this.selectedValue != '') {
                        this.isValueSelected = true;
                        this.isInvalid = true;
                        console.log('customLookUp ' + this.selectedName);
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        } else {
            this.selectedValue = '';
            this.selectedName = '';
            this.strvalue = '';
            this.isValueSelected = false;
            this.isInvalid = false;
        }
        if (this.disabled != null && this.disabled != '') {
            if (this.disabled != 'false') {
                this.strDisabled = true;
            }
        }
    }
    /**
     * When the user clicks on the input box, the input box is given focus and the dropdown is opened
     */
    handleClick() {
        this.isInvalidSelect = false;
        this.inputClass = '';
        this.searchTerm = '';
        this.inputClass = 'slds-has-focus';
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open';
    }
    /**
     * Hide search List.
     * When the user clicks away from the input box, the class of the input box is changed to remove the
     "slds-is-open" class
     */
    onBlur() {
        this.blurTimeout = setTimeout(() => { this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus' }, 300);
    }
    /**
     * Handle picklist selection.
     * The function is called when a user clicks on a dropdown option. It sets the selected value and
     name, and sets the isValueSelected flag to true
     * @param event - The event object that is passed to the handler.
     */
    onSelect(event) {
        this.isInvalid = true;
        this.selectedValue = event.currentTarget.dataset.id;
        console.log('Selected : ' + this.selectedValue);
        this.updatehandler();
        this.selectedName = event.currentTarget.dataset.name;
        this.isValueSelected = true;

        if (this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    }

    /**
     * The function sets the isInvalid, isValueSelected, selectedValue, and updatehandler variables to
     false, false, null, and null respectively
     */
    handleRemovePill() {
        this.isInvalid = false;
        this.isValueSelected = false;
        this.selectedValue = null;
        this.updatehandler();
    }
    /**
     * The onChange function is called when the user types in the search box. The event object is
     passed to the function and the value of the search box is assigned to the search variable
     * @param event - The event object that is passed to the function.
     */
    onChange(event) {
        this.search = event.target.value;
    }
    /**
     * this function will return the field value to parent component.
     * The updatehandler function is called when the user selects a value from the lookup. It then
     dispatches a custom event called selectedlookup. The custom event contains the selected value
     */
    updatehandler() {
        console.log('update handler ' + this.selectedValue);
        const valueSelectedEvent = new CustomEvent('selectedlookup', { detail: { value: this.selectedValue } });
        this.dispatchEvent(valueSelectedEvent);

    }
    /**
     * The function isValidSelection() is called when the user clicks the submit button. If the user has
     not selected a value from the dropdown, the function returns false and the inputClass is set to
     'slds-has-error'. If the user has selected a value from the dropdown, the function returns true
     and the inputClass is set to ''
     * @returns The validity of the input.
     */
    @api isValidSelection() {
        if (this.isInvalid == false) {
            this.inputClass = 'slds-has-error';
            this.isInvalidSelect = true;
        } else {
            this.inputClass = '';
            this.isInvalidSelect = false;
        }
        console.log('validityCheck : ' + this.isInvalid);
        return (this.isInvalid);
    }
    /**
    * this function will be invoked from parent component
    * It changes the value of the variable strvalue to the value passed in the parameter.
    * @param value - The value of the input field.
    */
    @api changevalue(value) {
        this.strvalue = value;
        this.onLoad();
    }
}