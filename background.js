// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const QAMAINT_CONSUL = {hostContains: 'qamaint-consul-alb'};
const QA1_CONSUL = {hostContains: 'qa1-consul-alb'};
const STAGE_CONSUL = {hostContains: 'stage-consul-alb'};
const PROD_CONSUL = {hostContains: 'consul.prod.showtime'};

chrome.runtime.onInstalled.addListener(function () {
    chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
        getDataCenter(details)
    }, {url: [QAMAINT_CONSUL, QA1_CONSUL, STAGE_CONSUL, PROD_CONSUL]});


    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: QAMAINT_CONSUL,
                }),
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: QA1_CONSUL,
                }),
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: STAGE_CONSUL,
                }),
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: PROD_CONSUL,
                })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });

    let getAllServices = function (details, dc) {
        $.ajax({
            url: getAllServicesUrl(details, dc),
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                let items = [];
                $.each(data, function (index, val) {
                    items.push(val.Name);
                });
                // gotta save the hostName in cache so we can get it in popup.js
                chrome.storage.sync.set({
                    items: items,
                    hostName: getHostname(details),
                    dc: dc
                }, function () {
                    console.log("Just discovered these microservices: " + items);
                });
            }
        });
    };

    let getDataCenter = function (details) {
        $.ajax({
            url: getDataCenterUrl(details),
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (!data) {
                    console.error("BISCUIT! No data center was returned from consul endpoint! Bastards!")
                }
                getAllServices(details, data[0]);
            }
        });
    };

    let getDataCenterUrl = function (details) {
        return constructFullUrl(details, "/v1/catalog/datacenters");
    };

    let getAllServicesUrl = function (details, dc) {
        return constructFullUrl(details, "/v1/internal/ui/services?dc=" + dc);
    };

    let constructFullUrl = function (details, endpoint) {
        let url = getHostname(details) + endpoint;
        console.log("making a call for " + url);
        return url;
    };

    let getHostname = function (details) {
        return "http://" + new URL(details.url).hostname;
    };
});