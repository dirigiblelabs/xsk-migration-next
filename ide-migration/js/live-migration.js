/*
 * Copyright (c) 2010-2022 SAP and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *   SAP - initial API and implementation
 */
const liveMigrationView = angular.module('live-migration', ['ideUI', 'ideView', 'ideWorkspace']);

liveMigrationView.config(["messageHubProvider", function (messageHubProvider) {
    messageHubProvider.eventIdPrefix = 'xsk-migration';
}]);

liveMigrationView.controller('LiveMigrationViewController', ['$scope', '$window', 'messageHub', 'workspaceApi', function ($scope, $window, messageHub, workspaceApi) {
    $scope.selectedWorkspace = { name: 'workspace' }; // Default
    $scope.workspaceNames = [];
    $scope.wizard = {
        currentStep: 1,
        completedSteps: 0,
        stepsCount: 4
    };

    $scope.regionItems = [
        { value: 1, text: 'Australia (Sydney) | ap1.hana.ondemand.com' },
        { value: 2, text: 'Europe (Rot) | eu1.hana.ondemand.com' },
        { value: 3, text: 'Europe (Frankfurt) | eu2.hana.ondemand.com' },
        { value: 4, text: 'Europe (Amsterdam) | eu3.hana.ondemand.com' },
        { value: 5, text: 'Japan (Tokyo) | jp1.hana.ondemand.com' }
    ];
    $scope.selectedRegion = {};

    $scope.test = function () {
        console.log($scope.selectedRegion);
    };

    $scope.getIndicatorGlyph = function (step) {
        return step <= $scope.wizard.completedSteps ? 'sap-icon--accept' : undefined;
    };

    $scope.isLastStep = function () {
        return $scope.wizard.currentStep === $scope.wizard.stepsCount;
    };

    $scope.allStepsCompleted = function () {
        return $scope.wizard.completedSteps >= $scope.wizard.stepsCount;
    };

    $scope.gotoStep = function (step) {
        $scope.wizard.currentStep = step;
    };

    $scope.revert = function (completedStepsCount) {
        $scope.wizard.completedSteps = completedStepsCount;
    }

    $scope.gotoNextStep = function () {
        if ($scope.wizard.currentStep > $scope.wizard.completedSteps) {
            $scope.wizard.completedSteps = $scope.wizard.currentStep;
        }

        if ($scope.wizard.currentStep <= $scope.wizard.stepsCount) {
            $scope.gotoStep($scope.wizard.currentStep + 1);
        }
    }

    $scope.gotoPreviousStep = function () {
        if ($scope.wizard.currentStep > 1) {
            $scope.gotoStep($scope.wizard.currentStep - 1);
        }
    }

    $scope.isSelectedWorkspace = function (name) {
        if ($scope.selectedWorkspace.name === name) return true;
        return false;
    };

    $scope.switchWorkspace = function (workspace) {
        if ($scope.selectedWorkspace.name !== workspace) {
            $scope.selectedWorkspace.name = workspace;
        }
    };

    $scope.reloadWorkspaceList = function () {
        let userSelected = JSON.parse(localStorage.getItem('DIRIGIBLE.workspace') || '{}');
        if (!userSelected.name) {
            $scope.selectedWorkspace.name = 'workspace'; // Default
        } else {
            $scope.selectedWorkspace.name = userSelected.name;
        }
        workspaceApi.listWorkspaceNames().then(function (response) {
            if (response.status === 200)
                $scope.workspaceNames = response.data;
            else messageHub.setStatusError('Unable to load workspace list');
        });
    };

    messageHub.onWorkspacesModified(function () {
        $scope.reloadWorkspaceList();
    });

    $scope.cancel = function () {
        messageHub.showDialog(
            "Are you sure?",
            'Any changes you made will be lost.',
            [{
                id: "b1",
                type: "emphasized",
                label: "Yes",
            },
            {
                id: "b2",
                type: "normal",
                label: "No",
            }],
            "xsk-migration.live.dialog.cancel"
        );
    };

    messageHub.onDidReceiveMessage(
        'live.dialog.cancel',
        function (data) {
            if (data.data === 'b1') {
                messageHub.postMessage('change.view', { view: 'history' });
            }
        },
    );

    $scope.reloadWorkspaceList();
}]);