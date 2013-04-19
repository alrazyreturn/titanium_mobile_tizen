// Wraps Tizen interface "SystemInfoCPU" that resides in Tizen module "SystemInfo".

define(['Ti/_/declare', 'Ti/_/Evented'], function(declare, Evented) {

	var cpu = declare(Evented, {

		constructor: function(args) {
			if (args instanceof tizen.cpuinfo) {
				// args is a native Tizen object; simply wrap it (take ownership of it)
				this._obj = args;
			}
		},

		constants: {
			load: {
				get: function() {
					return this._obj.load;
				}
			}
		}
	});

	// Initialize declaredClass, so that toString() works properly on such objects.
	// Correct operation of toString() is required for proper wrapping and automated testing.
	cpu.prototype.declaredClass = 'Tizen.SystemInfo.SystemInfoCpu';
	return cpu;
});
