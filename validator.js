function UniversalValidationForm() {
    this.options = null;
    this.root = null;
    this.fields = [];
}

function UniversalValidationField(sourceValidator) {

    this.sourceValidator = sourceValidator;

    this.field = null;
    this.fieldParent = null;
    this.errorTarget = null;

    this.inErrorState = false;

    this.required = false;
    this.errorMessage = null;
    this.minLength = -1;
    this.maxLength = -1;
    this.regex = null;
    this.customValidator = null;
    this.additionalErrorStates = [];

}

function UniversalValidation() {
    this.forms = [];
}

UniversalValidationField.prototype.setErrorMessage = function() {

    // set error states
    this.inErrorState = true;

    // setup error state message and send it.
    var x = document.createElement('span');

    // If we wanted to add an addressable ID to the span so we can animate/manage etc, we can
    // do that here.
    //
    // var transientId = 'error-id-' + (Math.round((new Date()).getTime() * Math.random()));
    // x.setAttribute('id', transientId);

    x.style.color = this.sourceValidator.options.errorMessageColor;
    x.innerText = this.errorMessage;
    this.errorTarget.append(x);

    // set the error state classes
    this.fieldParent.addClass(this.sourceValidator.options.errorClass);

    for (var i = 0; i < this.additionalErrorStates.length; i++) {
        this.additionalErrorStates[i].addClass(this.sourceValidator.options.errorClass);
    }

}

UniversalValidationField.prototype.validate = function() {

    // clean up field from previous validations
    this.inErrorState = false;

    if (this.errorTarget != null) {
        this.errorTarget.empty();
    }
    if (this.fieldParent.hasClass(this.sourceValidator.options.errorClass)) {
        this.fieldParent.removeClass(this.sourceValidator.options.errorClass);
    }
    if (this.additionalErrorStates.length > 0) {
        for (var i = 0; i < this.additionalErrorStates.length; i++) {
            if (this.additionalErrorStates[i].hasClass(this.sourceValidator.options.errorClass)) {
                this.additionalErrorStates[i].removeClass(this.sourceValidator.options.errorClass);
            }
        }
    }

    // validate the field
    if (this.required === true) {
        if ($.trim(this.field.val()).length === 0) {
            this.setErrorMessage();
            return false;
        }
    }
    if (this.minLength !== -1) {
        if ($.trim(this.field.val()).length < this.minLength) {
            this.setErrorMessage();
            return false;
        }
    }
    if (this.maxLength !== -1) {
        if ($.trim(this.field.val()).length > this.maxLength) {
            this.setErrorMessage();
            return false;
        }
    }
    if (this.regex !== null) {
        var re = new RegExp(this.regex);
        if (re.test(this.field.val()) === false) {
            this.setErrorMessage();
            return false;
        }
    }
    if (this.customValidator !== null) {
        if (this.customValidator() === false) {
            this.setErrorMessage();
            return false;
        }
    }

    return true;

};

UniversalValidationForm.prototype.validate = function() {

    var r = true;

    for (var i = 0; i < this.fields.length; i++) {
        if (this.fields[i].validate() === false) {
            r = false;
        }
    }

    return r;

};

UniversalValidationForm.prototype.formSubmitTrigger = function(submitButton, sourceObject) {

    var target = this;

    submitButton.click(function(e) {
        if (!target.validate()) {

            e.preventDefault();

            for (var i = 0; i < target.fields.length; i++) {
                if (target.fields[i].inErrorState === true) {
                    $([document.documentElement, document.body]).animate({
                        scrollTop: (target.fields[i].field.offset().top - sourceObject.options.scrollOffset)
                    }, sourceObject.options.scrollTime);
                    break;
                }
            }

        } else {
            target.root.submit();
        }
    });

};

UniversalValidationForm.prototype.instrument = function(sourceObject) {
    var target = this;
    this.root.find('input').each(function() {
        if ($(this).attr('type') === 'submit') {
            target.formSubmitTrigger($(this), sourceObject);
        }
    });
    this.root.find('button').each(function() {
        if ($(this).attr('type') === 'submit') {
            target.formSubmitTrigger($(this), sourceObject);
        }
    });
};

UniversalValidationField.prototype.captureAttributes = function() {

    var target = this;

    target.field.each(function() {
        $.each(this.attributes, function() {
            if(this.specified) {
                // is this field required?
                if (this.name.toLowerCase() === 'required') {
                    if ($.trim(this.value).length === 0 ||
                        $.trim(this.value.toLowerCase()) === 'required' ||
                        $.trim(this.value.toLowerCase()) === 'true') {
                        target.required = true;
                    }
                }
                // does this field have an error message?
                else if (this.name.toLowerCase() === 'data-error') {
                    target.errorMessage = $.trim(this.value);
                    if (target.errorMessage.length === 0) {
                        target.errorMessage = null;
                    }
                }
                // does this field have a minimum length?
                else if (this.name.toLowerCase() === 'minlength') {
                    target.minLength = parseInt(this.value);
                    if (isNaN(target.minLength)) {
                        target.minLength = -1;
                    }
                }
                // does this field have a maximum length?
                else if (this.name.toLowerCase() === 'maxlength') {
                    target.maxLength = parseInt(this.value);
                    if (isNaN(target.maxLength)) {
                        target.maxLength = -1;
                    }
                }
                // does this field hav a regex pattern?
                else if (this.name.toLowerCase() === 'pattern') {
                    target.regex = $.trim(this.value);
                    if (target.regex.length === 0) {
                        target.regex = null;
                    }
                }
                // does this field have a custom validator?
                else if (this.name.toLowerCase() === 'data-custom') {
                    var customValidatorName = $.trim(this.value);

                    if ($.trim(customValidatorName).length > 0 &&
                        typeof target.sourceValidator.options.custom[customValidatorName] === 'function') {
                        target.customValidator = target.sourceValidator.options.custom[customValidatorName];
                    }
                }
                // does this field have additional error states?
                else if (this.name.toLowerCase() === 'data-additional-error-states') {

                    var additionalErrorStates = $.trim(this.value).split(",");
                    target.additionalErrorStates = [];

                    for (var i = 0; i < additionalErrorStates.length; i++) {

                        var c = $.trim(additionalErrorStates[i]);

                        if (c.length === 0) {
                            continue;
                        }

                        var selector = $('#'+c);

                        if (selector.length && selector.parent().length) {
                            target.additionalErrorStates.push(selector.parent());
                        }
                    }


                }
            }
        });
    });

};

UniversalValidationForm.prototype.captureField = function(field, sourceObject) {
    if (field.attr('type') === 'hidden') {
        return;
    }

    var errorSheet = null;

    field.parent().siblings().each(function() {
        if ($(this).hasClass(sourceObject.options.errorBlock)) {
            errorSheet = $(this);
        }
    });

    var f = new UniversalValidationField(sourceObject);
    f.errorTarget = errorSheet;
    f.fieldParent = field.parent();
    f.field = field;

    f.captureAttributes();

    this.fields.push(f);
}

UniversalValidation.prototype.capture = function() {

    var target = this;

    $('body').find('form').each(function() {
        if ($(this).attr('data-validation') === 'true') {
            var f = new UniversalValidationForm();
            f.root = $(this);
            f.root.find('input, select').each(function() { f.captureField($(this), target); });
            target.forms.push(f);
        }
    });

};

UniversalValidation.prototype.instrument = function() {
    for (var i = 0; i < this.forms.length; i++) {
        this.forms[i].instrument(this);
    }
};

UniversalValidation.prototype.setDefaultOption = function(name, value) {
    if (this.options.hasOwnProperty(name) === false) {
        this.options[name] = value;
    }
};

UniversalValidation.prototype.setDefaultOptions = function() {
    this.setDefaultOption("errorClass", "has-error");
    this.setDefaultOption("errorBlock", "with-errors");
    this.setDefaultOption('errorMessageColor', 'red');
    this.setDefaultOption('scrollTime', 750);
    this.setDefaultOption('scrollOffset', 0);
    this.setDefaultOption("custom", {});
};

UniversalValidation.prototype.validate = function(options) {

    if (options === undefined) {
        this.options = {};
    } else {
        this.options = options;
    }

    this.setDefaultOptions();
    this.capture();
    this.instrument();
};