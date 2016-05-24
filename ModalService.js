/**
 * UI-Bootstrap Helpers :: v1.0 :: 12-May-2016
 *
 * Copyright (c) 2015 | Sumanth Sampath
 * License: MIT
 */
(function (angular, window, document, undefined) {
    'use strict-di';
    angular.module('uiBootstrapHelpers', ['ui.bootstrap', 'template/defaultModal.html'])
.factory('modalService', ['$uibModal', function (uibModal) {


    var showModal = function (modalOptions, modalDefaults) {
        if (!modalOptions)
            throw "modalOptions should be provided a non null value";
        modalOptions.showCloseButton = true;
        modalOptions.showMultiActions = null;
        return open(modalOptions, modalDefaults);
    };

    var showMultiActionModal = function (modalOptions, modalDefaults) {
        if (!modalOptions)
            throw "modalOptions should be provided a non null value";
        modalOptions.showCloseButton = true;
        if (!modalOptions.showMultiActions)
            modalOptions.actionButtonText = modalOptions.actionButtonText ? modalOptions.actionButtonText : "Ok";
        else {
            if(!angular.isArray(modalOptions.showMultiActions))
                throw "modalOptions.showMultiActions should be an array";
        }

        return open(modalOptions, modalDefaults);
    };
    
    var showAlert = function (modalOptions, modalDefaults) {
        if (!modalOptions)
            throw "modalOptions should be provided a non null value";
        modalOptions.showCloseButton = false;
        modalOptions.showMultiActions = null;
        return open(modalOptions, modalDefaults);
    };

    var open = function (modalOptions, modalDefaults) {

        modalOptions.headerText = modalOptions.headerText ? modalOptions.headerText : "";
        modalOptions.bodyText = modalOptions.bodyText ? modalOptions.bodyText : "";
        modalOptions.actionButtonText = modalOptions.actionButtonText ? modalOptions.actionButtonText : "Ok";
        modalOptions.closeButtonText = modalOptions.closeButtonText ? modalOptions.closeButtonText : "Cancel";

        if (!modalDefaults) modalDefaults = {};
          
        modalDefaults.templateUrl = modalDefaults.templateUrl ? modalDefaults.templateUrl : 'template/defaultModal.html';

        //Create temp objects to work with since we're in a singleton service
        var tempModalOptions = {};
        var tempModalDefaults = {};

        //Map modal.html $scope custom properties to defaults defined in service
        angular.extend(tempModalOptions, modalOptions);

        //Map angular-bootstrap-ui modal custom defaults to modal defaults defined in service
        angular.extend(tempModalDefaults, modalDefaults);
        if (!tempModalDefaults.controllerAs) {
            tempModalDefaults.controllerAs = "vm";
        }

        if (!tempModalDefaults.controller) {

            tempModalDefaults.controller = ['$uibModalInstance', function (uibModalInstance) {
                this.modalOptions = tempModalOptions;
                this.modalOptions.ok = function (result) {
                    uibModalInstance.close(result);
                };
                this.modalOptions.close = function (result) {
                    uibModalInstance.dismiss('cancel');
                };
            }]
        };

        return uibModal.open(tempModalDefaults).result;
    };

    return modalService = {
        showModal: showModal,
        showAlert: showAlert,
        showMultiActionModal: showMultiActionModal
    };
}]);
angular.module("template/defaultModal.html", []).run(["$templateCache", function ($templateCache) {
        $templateCache.put("template/defaultModal.html",
    "<div class=\"modal-header\">\n" +
    "    <h5 class=\"modal-title\"><span ng-bind=\"vm.modalOptions.headerText\"></span></h5>\n" +
    "</div>\n" +
    "<div class=\"modal-body\" style=\"word-wrap: break-word;\" ng-bind-html=\"vm.modalOptions.bodyText\"></div>\n" +
    "<div class=\"modal-footer\">\n" +
    "<div class\modal-footer\">\n" +
    "   <button ng-show=\"!vm.modalOptions.showMultiActions\" class=\" btn btn-primary\" type=\"button\" ng-click=\"vm.modalOptions.ok();\"><span ng-bind=\"vm.modalOptions.actionButtonText\"></span></button>\n" +
    "   <span ng-show=\"vm.modalOptions.showMultiActions\" ng-repeat=\"actions in vm.modalOptions.showMultiActions\">\n" +
    "       <button ng-show=\"actions.visible\" class=\"btn btn-primary\" type=\"button\" ng-click=\"vm.modalOptions.ok(actions.value);\"><span ng-bind=\"actions.text\"></span></button>\n" +
    "   </span>\n" +
    "   <button ng-show=\"vm.modalOptions.showCloseButton\" class=\"btn btn-warning\" type=\"button\" ng-click=\"vm.modalOptions.close();\"><span ng-bind=\"vm.modalOptions.closeButtonText\"></span></button>\n" +
    "</div>\n"
    );
}]);
})(window.angular, window, document);