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
    $scope.isLoading = false;
    $scope.wizard = {
        currentStep: 1,
        completedSteps: 0,
        stepsCount: 4,
        nextEnabled: false,
    };
    $scope.forms = {
        neo: {},
        hana: {},
        du: {},
    };

    $scope.neoInputs = {
        region: {
            selected: undefined,
            items: [
                { value: 1, text: 'Australia (Sydney) | ap1.hana.ondemand.com' },
                { value: 2, text: 'Europe (Rot) | eu1.hana.ondemand.com' },
                { value: 3, text: 'Europe (Frankfurt) | eu2.hana.ondemand.com' },
                { value: 4, text: 'Europe (Amsterdam) | eu3.hana.ondemand.com' },
                { value: 5, text: 'Japan (Tokyo) | jp1.hana.ondemand.com' },
            ]
        },
        subaccountTechnicalName: '',
        username: '',
        password: '',
    };
    $scope.hanaInputs = {
        database: {
            selected: 0,
            items: [
                { value: 1, text: 'db-1' },
                { value: 2, text: 'db-2' },
                { value: 3, text: 'db-3' },
            ]
        },
        username: '',
        password: '',
    };
    $scope.duInputs = {
        workspaces: {
            selected: undefined,
            items: [],
        },
        du: {
            selected: undefined,
            items: [
                { value: 1, text: 'du-1' },
                { value: 2, text: 'du-2' },
                { value: 3, text: 'du-3' },
            ],
        },
    };
    $scope.changes = {
        changedFiles: 2,
        diffType: 'split',
        changes: [
            {
                path: '/workspace/myexampleapp/example.js',
                contentType: 'application/javascript',
                original: 'var a = 0',
                modified: 'let a = 1;',
            },
            {
                path: '/workspace/myexampleapp/example2.js',
                contentType: 'application/javascript',
                original: 'var a = 40',
                modified: 'let a = 10;',
            }
        ],
    };

    $scope.migrationStatus = 'ongoing';
    $scope.migrationStatusMessage = 'Configuration processing...';

    $scope.completeFakeMigration = function () {
        $scope.migrationStatus = 'complete';
    };

    $scope.goToWorkbench = function () {
        let workspaceName;
        for (let i = 0; i < $scope.duInputs.workspaces.items.length; i++) {
            if ($scope.duInputs.workspaces.items[i].value === $scope.duInputs.workspaces.selected) {
                workspaceName = $scope.duInputs.workspaces.items[i].text;
            }
        }
        workspaceApi.setWorkspace(workspaceName);
        messageHub.openPerspective("../ide/index.html");
    };

    // For setting the state of the input, mainly used for error.
    $scope.neoUsernameInput = {
        state: '',
        message: '',
    };
    $scope.hanaUsernameInput = {
        state: '',
        message: '',
    };

    $scope.showPassword = function (id) {
        let input = $window.document.getElementById(id);
        if (input.type === "password") {
            input.type = "text";
            return 'sap-icon--show';
        } else {
            input.type = "password";
            return 'sap-icon--hide';
        }
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

    $scope.getParams = function (change) {
        return {
            contentType: change.contentType,
            original: change.original,
            modified: change.modified,
        }
    };

    $scope.diffViewType = function (type) {
        $scope.changes.diffType = type;
        messageHub.postMessage('git.diff.view.type', { type: type }, true);
    };

    $scope.createWorkspace = function () {
        messageHub.showFormDialog(
            'migrationCreateWorkspace',
            'Create a workspace',
            [
                {
                    id: "pgfi1",
                    type: "input",
                    label: "Name",
                    required: true,
                    placeholder: "workspace name",
                    pattern: '^[^/]*$',
                },
            ],
            [{
                id: 'b1',
                type: 'emphasized',
                label: 'Create',
                whenValid: true,
            },
            {
                id: 'b2',
                type: 'transparent',
                label: 'Cancel',
            }],
            'xsk-migration.create.workspace',
            'Creating...',
        );
    };

    $scope.reloadWorkspaceList = function () {
        let userSelected = JSON.parse(localStorage.getItem('DIRIGIBLE.workspace') || '{}');
        if (!userSelected.name) {
            userSelected.name = 'workspace'; // Default
        }
        workspaceApi.listWorkspaceNames().then(function (response) {
            if (response.status === 200) {
                $scope.duInputs.workspaces.items.length = 0;
                $scope.duInputs.workspaces.selected = undefined;
                for (let i = 0; i < response.data.length; i++) {
                    $scope.duInputs.workspaces.items.push({
                        value: i,
                        text: response.data[i],
                    });
                }
            } else messageHub.showAlertError('Workspaces error', 'Unable to load workspace list.');
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
        'create.workspace',
        function (msg) {
            if (msg.data.buttonId === "b1") {
                workspaceApi.createWorkspace(msg.data.formData[0].value).then(function (response) {
                    messageHub.hideFormDialog('migrationCreateWorkspace');
                    if (response.status !== 201) {
                        messageHub.showAlertError(
                            'Failed to create workspace',
                            `An unexpected error has occurred while trying create a workspace named '${msg.data.formData[0].value}'`
                        );
                        messageHub.setStatusError(`Unable to create workspace '${msg.data.formData[0].value}'`);
                    } else {
                        messageHub.setStatusMessage(`Created workspace '${msg.data.formData[0].value}'`);
                        messageHub.announceWorkspacesModified();
                    }
                });
            } else messageHub.hideFormDialog('migrationCreateWorkspace');
        }
    );

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