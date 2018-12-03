let servicesList = $('#services-list');

chrome.storage.sync.get('items', function (data) {
    $.each(data.items, function (index, item) {
        let button = $('<button>' + item + '</button>');
        servicesList.append(button);
        button.click(onClickMakeCallToGetIp);
    });
});

let onClickMakeCallToGetIp = function () {
    let serviceName = $(this).text();

    // now make a call health/service for the right env to get IP addresses.
    chrome.storage.sync.get(['hostName', 'dc'], function (data) {
        let endpoint = data.hostName + '/v1/health/service/' + serviceName + '?dc=' + data.dc;
        $.ajax({
            url: endpoint,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                let match;
                let items = [];
                $.each(data, function (index, mainObj) {
                    $.each(mainObj.Checks, function (index2, check) {
                        if (check.Output.includes("200 OK Output")) {
                            match = check.Output.match(/\bhttps?:\/\/\S+/gi)[0];
                            match = match.substr(0, match.length - 1);
                            return false;
                        }
                    });
                    if (match) {
                        return false;
                    }
                });
                if (!match) {
                    alert("The service " + serviceName + " has no healthy node up and running currently.");
                }
                chrome.tabs.create({url: match});
            }
        });
    });
};