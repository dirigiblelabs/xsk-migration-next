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
const zipMigrationView = angular.module('zip-migration', ['ideUI', 'ideView', 'ideWorkspace', 'ideTransport', 'angularFileUpload']);

zipMigrationView.config(["messageHubProvider", function (messageHubProvider) {
    messageHubProvider.eventIdPrefix = 'xsk-migration';
}]);

zipMigrationView.controller('ZipMigrationViewController', ['$scope', '$window', 'messageHub', 'workspaceApi', 'transportApi', 'FileUploader', function ($scope, $window, messageHub, workspaceApi, transportApi, FileUploader) {
    let projectImportUrl = transportApi.getProjectImportUrl();
    $scope.selectedWorkspace = { name: 'workspace' }; // Default
    $scope.workspaceNames = [];
    $scope.zipPaths = [];
    $scope.uploader = new FileUploader({
        url: projectImportUrl
    });

    $scope.uploader.filters.push({
        name: 'customFilter',
        fn: function (item /*{File|FileLikeObject}*/, options) {
            let type = item.type.slice(item.type.lastIndexOf('/') + 1);
            if ($scope.importType !== 'file')
                if (type != 'zip' && type != 'x-zip' && type != 'x-zip-compressed') {
                    return false;
                }
            return this.queue.length < 100;
        }
    });

    $scope.uploader.onBeforeUploadItem = function (item) {
        item.url = new UriBuilder().path(projectImportUrl.split('/')).path($scope.selectedWorkspace.name).build();
    };

    $scope.uploader.onCompleteItem = function (fileItem) {
        $scope.zipPaths.push($scope.projectFromZipPath(fileItem.file.name));
    };

    $scope.uploader.onCompleteAll = function () {
        $scope.startZipMigration($scope.selectedWs, $scope.uploader);
    };

    $scope.removeAll = function (uploader) {
        $scope.uploader.clearQueue();
        $scope.zipPaths = [];
    };

    $scope.startZipMigration = function (ws, uploader) {
        // if (!$scope.uploader.queue || !$scope.uploader.queue.length) return false;
        // let zipPaths = [];

        // for (const uploadedFile of $scope.uploader.queue) {
        //     const fileName = uploadedFile.file.name;
        //     zipPaths.push($scope.projectFromZipPath(fileName));
        // }

        // let body = {
        //     workspace: ws,
        //     zipPath: zipPaths,
        // };

        // migrationFlow.goForward();

        // $http
        //     .post("/services/v4/js/ide-migration/server/migration/api/migration-rest-api.mjs/start-process-from-zip", body, {
        //         headers: { "Content-Type": "application/json" },
        //     })
        //     .then(
        //         function (response) {
        //             if (response.data.processInstanceId) {
        //                 $scope.migrationFinished = true;
        //                 messageHub.postMessage("start-zip-migration", {
        //                     migrationFinished: true,
        //                     workspace: body.workspace,
        //                     error: false,
        //                 });
        //             } else {
        //                 $scope.migrationFinished = false;

        //                 messageHub.showAlertError(noProcessErrorTitle, noProcessErrorDescription);
        //                 migrationFlow.goBack();

        //                 $scope.removeAll($scope.uploader);
        //             }
        //         },
        //         function (response) {
        //             $scope.migrationFinished = false;
        //             messageHub.showAlertError("Migration failed", response.error.message);
        //             migrationFlow.goBack();
        //             $scope.removeAll($scope.uploader);
        //         }
        //     );
    };

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

    $scope.addFiles = function () {
        $window.document.getElementById('input').click();
    };

    $scope.migrate = function () {
        messageHub.showLoadingDialog('xskZipMigration', 'Migration in progress', 'Configuration processing...',);
        setTimeout(function () {
            messageHub.updateLoadingDialog(
                'xskZipMigration',
                'Cleaning up...'
            );
        }, 4000);
        setTimeout(function () {
            messageHub.hideLoadingDialog(
                'xskZipMigration',
            );
            messageHub.showDialog(
                'Migration complete!',
                'Successfully migrated the delivery unit(s). You can now go to Workbench and publish them.',
                [{
                    id: 'b1',
                    type: 'emphasized',
                    label: 'Go to Workbench',
                },
                {
                    id: 'b2',
                    type: 'normal',
                    label: 'Migrate more',
                },
                {
                    id: 'b3',
                    type: 'transparent',
                    label: 'Close',
                }],
                'xsk-migration.zip.dialog.done',
            );
        }, 6000);
    };

    $scope.cancel = function () {
        messageHub.showDialog(
            'Are you sure?',
            'Any changes you made will be lost.',
            [{
                id: 'b1',
                type: 'emphasized',
                label: 'Yes',
            },
            {
                id: 'b2',
                type: 'normal',
                label: 'No',
            }],
            'xsk-migration.zip.dialog.cancel',
        );
    };

    messageHub.onDidReceiveMessage(
        'zip.dialog.cancel',
        function (data) {
            if (data.data === 'b1') {
                messageHub.postMessage('change.view', { view: 'history' });
            }
        },
    );

    messageHub.onDidReceiveMessage(
        'zip.dialog.done',
        function (data) {
            if (data.data === 'b1') {
                messageHub.openPerspective("../ide/index.html");
            } else if (data.data === 'b3') {
                messageHub.postMessage('change.view', { view: 'history' });
            }
        },
    );

    $scope.reloadWorkspaceList();
}]);