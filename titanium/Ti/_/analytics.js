define(["Ti/_", "Ti/_/dom", "Ti/_/has", "Ti/_/lang", "Ti/App", "Ti/Platform"],
	function(_, dom, has, lang, App, Platform) {

	var global = window,
		is = require.is,
		cfg = require.config,
		analyticsEnabled = App.analytics,
		analyticsLastSent = null,
		analyticsUrl = "https://api.appcelerator.net/p/v2/mobile-web-track",
		pending = {},
		sendTimer,
		sendDelay = 60000,
		analytics = {
			add: function(type, event, data, isUrgent) {
				if (analyticsEnabled) {
					// store event
					var storage = getStorage();

					storage.push({
						id: _.uuid(),
						type: type,
						evt: event,
						ts: (new Date).toISOString().replace('Z', "+0000"),
						data: data
					});

					setStorage(storage);
					this.send(isUrgent);
				}
			},

			send: function(isUrgent) {
				if (analyticsEnabled) {
					var rand = Math.floor(Math.random() * 1e6),
						now = Date.now(),
						ids = [],
						jsonStrs = [],
						sessionId = sessionStorage.getItem("ti:sessionId"),
						seqId = sessionStorage.getItem("ti:analyticsSeqId"),
						events = getStorage(),
						i = 0,
						len = events.length,
						evt;

					is(seqId, "String") && (seqId = JSON.parse(seqId));

					clearTimeout(sendTimer);

					if (len && (isUrgent || analyticsLastSent === null || now - analyticsLastSent >= sendDelay)) {
						sessionId || (sessionId = _.uuid());
						seqId === null && (seqId = 0);

						while (i < len) {
							evt = events[i++];

							ids.push(evt.id);
							jsonStrs.push(JSON.stringify({
								id: evt.id,
								mid: Platform.id,
								rdu: null,
								type: evt.type,
								aguid: App.guid,
								event: evt.evt,
								seq: seqId++,
								ver: "2",
								deploytype: App.deployType,
								sid: sessionId,
								ts: evt.ts,
								data: evt.data
							}));

							if (evt.type === "ti.end") {
								seqId = 0;
								sessionId = _.uuid();
							}
						}

						sessionStorage.setItem("ti:sessionId", sessionId);
						sessionStorage.setItem("ti:analyticsSeqId", seqId);

						pending[rand] = ids;
						analyticsLastSent = now;

						try {
								var xhr = new XMLHttpRequest;
								xhr.onreadystatechange = function() {
									if (xhr.readyState === 4 && xhr.status === 200) {
										try {
											onSuccess({ data: eval('(' + xhr.responseText + ')') });
										} catch (e) {}
									}
								};
								xhr.open("POST", analyticsUrl, true);
								xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
								xhr.send(lang.urlEncode({ content: jsonStrs }));
						}catch (e) {
							console.error('analytics exeption while sending request:' + e);
						}
					}

					sendTimer = setTimeout(function() {
						analytics.send(1);
					}, sendDelay);
				}
			}
		};

	function getStorage() {
		var s = localStorage.getItem("ti:analyticsEvents");
		return s ? JSON.parse(s) : [];
	}

	function setStorage(data) {
		localStorage.setItem("ti:analyticsEvents", JSON.stringify(data));
	}	

	function onSuccess(response) {
		if (is(response.data, "Object") && response.data.success) {
			var ids = pending[response.data.callback],
				keepers = [],
				events = getStorage(),
				i = 0,
				len = events.length,
				evt;

			if (ids) {
				while (i < len) {
					evt = events[i++];
					~ids.indexOf(evt.id) || keepers.push(evt);
				}
				setStorage(keepers);
			}
		}
	}

	require.on(global, "message", onSuccess);

	return analytics;

});