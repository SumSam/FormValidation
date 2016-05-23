/**
 * FormValidations :: v1.1 :: 24-Feb-2016
 *
 * Copyright (c) 2015 | Sumanth Sampath
 * License: MIT
 */
(function (angular, window, document, undefined) {
    'use strict-di';
    angular.module('FormValidations.Config', [])
    .constant('FormValidationsConfig', {
        basePath: '',
        displayOption: 'summary'
    });
    angular.module('FormValidations', ['template/validation/validation-summary-messages.html', 'template/validation/validation-item-messages.html', 'ngMessages', 'FormValidations.Config'])
.factory('ReadJson', ['$http', function (http) {
    return {
        get: function (url) {
            if (!(url.indexOf(".json") > -1))
                url += ".json";
            return http.get(url);
        }
    };
}])
.directive('validateForm', ['ReadJson', '$rootScope', 'FormValidationsConfig', function (ReadJson, rootScope, formValidationsConfig) {
    var ValidateAttributes = function (cntrlObj, element, attr) {
        if (element[0].tagName != "FORM")
            throw "validate-Form must be set only on a form element";

        if (!angular.isDefined(attr.name))
            throw "validate-Form must be set on an form element that has a 'name' attribute";

        if (attr.name == "")
            throw "validate-Form must be set on an form element that has a 'name' attribute set to a non blank value";

        if (angular.isDefined(attr.formVisibilityMap)) {
            if (!angular.isArray(cntrlObj.formVisibilityMap))
                throw "Value supplied to form-visibility-map should be of type 'array'";
        }

        if (!angular.isDefined(attr.resourcePath) || (cntrlObj.resourcePath === ""))
            throw "resource-Path should also be set alongside validate-form attribute to a non blank value";

        if (angular.isDefined(attr.displayOption)) {
            if (!(angular.lowercase(cntrlObj.displayOption) === "item" || angular.lowercase(cntrlObj.displayOption) === "summary"))
                throw "Invalid value for attribute 'display-Option'. Valid values are either 'Summary' or 'Item'";
        }

        if (angular.isDefined(attr.messageVisibilityMap)) {
            if (!angular.isArray(cntrlObj.messageVisibilityMap))
                throw "Value supplied to message-visibility-map should be of type 'array'";
        }
    };

    var BuildTypeMsgPair = function (validationType, jsonResult, elementName) {
        var valTypeMsgPair = { "type": "", "msg": "" };
        valTypeMsgPair.type = validationType.trim();
        var msg = jsonResult.data[elementName + "_" + valTypeMsgPair.type];
        valTypeMsgPair.msg = angular.isDefined(msg) ? msg : "##### KEY NOT FOUND #####";
        return valTypeMsgPair;
    };

    var BuildValidationList = function (formObject, element, valList, jsonResult, loopVariable) {
        var elementVal = { "name": "", "validations": [] };
        var elementName = element[0][loopVariable].name;
        
        if (angular.isObject(formObject) && angular.isObject(formObject[elementName]) && angular.isObject(formObject[elementName].$validators)) {
            var validationTypeArr = Object.getOwnPropertyNames(formObject[elementName].$validators);
            if (validationTypeArr.length > 0) {
                elementVal.name = elementName

                if (validationTypeArr.length > 1) {
                    for (var j = 0; j < validationTypeArr.length; j++) {
                        if (validationTypeArr[j] != "") {
                            elementVal.validations.push(BuildTypeMsgPair(validationTypeArr[j], jsonResult, elementVal.name));
                        }
                    }
                    valList.push(elementVal);
                }
                else {
                    if (validationTypeArr[0] != "") {
                        elementVal.validations.push(BuildTypeMsgPair(validationTypeArr[0], jsonResult, elementVal.name));
                        valList.push(elementVal);
                    }
                }
            }
        }
    };

    var cntrl = function (scope, element, attrs) {
       
        this.GetParentFormParams = function () {
            return { formObject: scope.$parent[attrs.name], element: element, attrs: attrs };
        };

        this.SetValidationList = function (formObject, element, valList, jsonResult, loopVariable) {
            BuildValidationList(formObject, element, valList, jsonResult, loopVariable);
        };
    };

    var link = function (scope, element, attrs, cntrl) {
        ValidateAttributes(cntrl, element, attrs);
        var resourcePath = cntrl.resourcePath;
        if (formValidationsConfig.basePath !== "")
            resourcePath = "/" + formValidationsConfig.basePath + '/' + resourcePath;
        var valList = [];

        if (!angular.isDefined(attrs.formVisibilityMap))
            cntrl.formVisibilityMap = [{ "name": attrs.name, "visible": true }];

        if (!angular.isDefined(attrs.displayOption))
            cntrl.displayOption = angular.lowercase(formValidationsConfig.displayOption) === "summary" ||
                angular.lowercase(formValidationsConfig.displayOption) === "item" ? formValidationsConfig.displayOption : "summary";

        if (angular.isDefined(attrs.resourcePath) && angular.lowercase(cntrl.displayOption) === "summary") {
            ReadJson.get(resourcePath).then(function (jsonResult) {

                for (var i = 0; i < element[0].length; i++) {
                    BuildValidationList(scope.$parent[attrs.name], element, valList, jsonResult, i);
                }

                rootScope.$emit("validateForm:ValListReady", {
                    validationList: valList,
                    formObject: scope.$parent[attrs.name],
                    formName: attrs.name
                });

            }, function (error) {
            });
        }

        var SetFocusListener = rootScope.$on('validateForm:SetFocus', function (event, elementName, formName) {
            if (attrs.name === formName) {
                for (var i = 0; i < element[0].length; i++) {
                    if (element[0][i].name === elementName) {
                        element[0][i].focus();
                        break;
                    }
                }
            }

        });

        scope.$watch(function () {
            return cntrl.formVisibilityMap;
        },
        function (newVal, oldVal) {
            if (newVal) {
                if (cntrl.formVisibilityMap[0].name === attrs.name)
                    rootScope.$emit("validateForm:SetFormVisibilityMap", cntrl.formVisibilityMap);
            }
        }, true);

        scope.$on('$destroy', function () {
            SetFocusListener();
        });
    };

    return {
        restrict: "A",
        bindToController: true,
        scope: {
            formVisibilityMap: "=?",
            disableAllIfAttr: '=?',
            resourcePath: '@',
            displayOption: '@?'
        },
        link: link,
        controller: ['$scope', '$element', '$attrs', cntrl],
        controllerAs: 'vm'
    }
}])
.directive('renderValidationMessages', ['$rootScope', function (rootScope) {

    var cntrl = function (scope) {
        this.multiValidationList = [];

        var ValListReadyListener = rootScope.$on('validateForm:ValListReady', angular.bind(this, function (event, params) {
            var singleForm = {
                "formName": params.formName,
                "validationList": params.validationList
            }

            this[params.formName] = params.formObject;
            this.multiValidationList.push(singleForm);

        }));

        var SetFormVisibilityMapListener = rootScope.$on('validateForm:SetFormVisibilityMap', angular.bind(this, function (event, formVisibilityMap) {
            angular.forEach(formVisibilityMap, angular.bind(this, function (item) {
                this[item.name + "_" + "isVisible"] = item.visible;
            }));

        }));

        this.setFocus = function (elemeName, formName) {
            rootScope.$emit("validateForm:SetFocus", elemeName, formName);
        };

        scope.$on('$destroy', function () {
            ValListReadyListener();
            SetFormVisibilityMapListener();
        });
    }

    return {
        restrict: "EA",
        templateUrl: 'template/validation/validation-summary-messages.html',
        controller: ['$scope', cntrl],
        controllerAs: 'vm'
    }
}])
.directive('validationFor', ['ReadJson', '$rootScope', 'FormValidationsConfig', function (ReadJson, rootScope, formValidationsConfig) {

    var link = function (scope, element, attrs, Ctrls) {
        var validationForCtrl = Ctrls[0];
        var validateFormCtrl = Ctrls[1];
        
        if (validationForCtrl.validationFor === "")
            throw "Value provided to attribute validation-For should be a non-blank value"
        var ElementList = [];
        var parentFormParams = validateFormCtrl.GetParentFormParams();
        if (angular.isDefined(validateFormCtrl.resourcePath) && angular.lowercase(validateFormCtrl.displayOption) === "item") {
            var formElement = parentFormParams.element;
            var formAttr = parentFormParams.attrs;
            var resourcePath = validateFormCtrl.resourcePath;
            if (formValidationsConfig.basePath !== "")
                resourcePath = "/" + formValidationsConfig.basePath + '/' + resourcePath;
            var valList = [];
            ReadJson.get(resourcePath).then(function (jsonResult) {
                for (var i = 0; i < formElement[0].length; i++) {
                    if (formElement[0][i].name === validationForCtrl.validationFor) {
                        validateFormCtrl.SetValidationList(parentFormParams.formObject, formElement, valList, jsonResult, i);
                        var SingleElement = {
                            "formName": formAttr.name,
                            "validationObj": valList[0]
                        }
                        ElementList.push(SingleElement);
                        break;
                    }
                }
                validationForCtrl[formAttr.name] = parentFormParams.formObject;
                validationForCtrl.ElementList = ElementList;
            }, function (error) {
            });

            scope.$watch(function () {
                return validateFormCtrl.formVisibilityMap;
            },
            function (newVal, oldVal) {
                if (newVal) {
                    angular.forEach(validateFormCtrl.formVisibilityMap, function (item) {
                        validationForCtrl[item.name + "_" + "isVisible"] = item.visible;
                    });
                }
            }, true);
        }
    };

    return {
        restrict: "EA",
        templateUrl: 'template/validation/validation-item-messages.html',
        bindToController: true,
        scope: {
            validationFor: '@'
        },
        require: ['validationFor', '^validateForm'],
        controller: function (){},
        link: link,
        controllerAs: 'vm'
    }
}]);
    angular.module("template/validation/validation-summary-messages.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("template/validation/validation-summary-messages.html",
        "<div ng-repeat=\"formItem in vm.multiValidationList\">\n" +
        "    <div ng-repeat=\"element in formItem.validationList\" ng-show=\"vm.{{formItem.formName}}_isVisible\">\n" +
        "       <div ng-messages=\"vm[formItem.formName][element.name].$error\" ng-show=\"vm[formItem.formName].$submitted || vm[formItem.formName][element.name].$dirty\" ng-repeat=\"typeMsgPair in element.validations\">\n" +
        "          <div ng-message-exp =\"typeMsgPair.type\"><span style = \"cursor: pointer;\" ng-click=\"vm.setFocus(element.name,formItem.formName)\">{{typeMsgPair.msg}}</span></div>\n" +
        "       </div>\n" +
        "    </div>\n" +
        " </div>\n" +
         "");
    }]);
    angular.module("template/validation/validation-item-messages.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("template/validation/validation-item-messages.html",
         "<div ng-repeat=\"element in vm.ElementList\" ng-show=\"vm.{{element.formName}}_isVisible\">\n" +
         "<div ng-messages=\"vm[element.formName][element.validationObj.name].$error\" ng-show=\"vm[element.formName].$submitted || vm[element.formName][element.validationObj.name].$dirty\" ng-repeat=\"typeMsgPair in element.validationObj.validations\">\n" +
         "  <div ng-message-exp =\"typeMsgPair.type\">{{typeMsgPair.msg}}</div>\n" +
         "</div>\n" +
          "");
    }]);

    
})(window.angular, window, document);
