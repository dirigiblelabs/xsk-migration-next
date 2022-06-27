const migrationPerspective = angular.module('migration', ['ideLayout', 'ideUI']);

migrationPerspective.config(["messageHubProvider", function (messageHubProvider) {
    messageHubProvider.eventIdPrefix = 'xsk-migration';
}]);

migrationPerspective.controller('MigrationPerspectiveController', ["$scope", "messageHub", function ($scope, messageHub) {
    $scope.currentView = 'history';

    messageHub.onDidReceiveMessage('change.view', function (msg) {
        $scope.$apply(function () {
            $scope.currentView = msg.data.view;
        });
    });
}]);