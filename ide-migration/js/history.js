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
const historyView = angular.module('history', ['ideUI', 'ideView']);

historyView.config(["messageHubProvider", function (messageHubProvider) {
    messageHubProvider.eventIdPrefix = 'xsk-migration';
}]);

historyView.controller('HistoryViewController', ['$scope', 'messageHub', function ($scope, messageHub) {
    $scope.historyData = [
        {
            executedBy: 'guest',
            startedAt: '10:40:12 16/06/2022',
            updatedAt: '10:40:12 16/06/2022',
            status: 'MIGRATION_CONTINUE'
        },
        {
            executedBy: 'guest',
            startedAt: '10:40:12 15/06/2022',
            updatedAt: '10:40:12 15/06/2022',
            status: 'MIGRATION_EXECUTED'
        },
        {
            executedBy: 'guest',
            startedAt: '10:40:12 14/06/2022',
            updatedAt: '10:40:12 14/06/2022',
            status: 'MIGRATION_FAILED'
        }
    ];

    $scope.getStatus = function (status) {
        switch (status) {
            case 'MIGRATION_CONTINUE':
                return { type: 'informative', text: 'Continue' };
            case 'MIGRATION_EXECUTED':
                return { type: 'positive', text: 'Executed' };
            default:
                return { type: 'negative', text: 'Failed' };
        }
    };

    $scope.liveProject = function () {
        messageHub.postMessage('change.view', { view: 'live' });
    };

    $scope.zipProject = function () {
        messageHub.postMessage('change.view', { view: 'zip' });
    };
}]);