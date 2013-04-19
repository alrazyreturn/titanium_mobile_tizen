// Wraps Tizen interface "CompositeFilter" that resides in Tizen module "Tizen".

define(['Ti/_/declare', 'Ti/_/Evented', 'Tizen/_/AttributeFilter', 'Tizen/_/AttributeRangeFilter'],
	function(declare, Evented, AttributeFilter, AttributeRangeFilter) {

	var filter = declare(Evented, {

		constructor: function(args) {
			if (args instanceof tizen.CompositeFilter) {
				// args is a native Tizen object; simply wrap it (take ownership of it)
				this._obj = args;
			} else {
				// args is a dictionary that the user of the wrapper module passed to the creator function.
				var i = 0,
					filters = args.filters,
					filtersCount = filters.length,
					result = [];

				for (; i < filtersCount; i++) {
					result.push(filters[i]._obj);
				}

				this._obj = new tizen.CompositeFilter(args.type, result);
			}
		},

		properties: {
			type: {
				get: function() {
					return this._obj.type;
				},
				set: function(value) {
					this._obj.type = value;
				}
			},
			filters: {
				get: function() {
					var i = 0,
						tizenFilters = this._obj.filters,
						len = tizenFilters.length,
						filters = [];

					for (; i < len; i++) {
						if(tizenFilters[i] instanceof tizen.AttributeFilter) {
							filters.push(new AttributeFilter(tizenFilters[i]));
						} else if(tizenFilters[i] instanceof tizen.CompositeFilter) {
							filters.push(new filter(tizenFilters[i]));
						} else if(tizenFilters[i] instanceof tizen.AttributeRangeFilter) {
							filters.push(AttributeRangeFilter(tizenFilters[i]));
						}
					}

					return filters;
				},
				set: function(values) {
					var i = 0,
						len = values.length,
						filters = [];

					for (; i < len; i++) {
						filters.push(values[i]._obj);
					}

					this._obj.filters = filters;
				}
			}
		}

	});

	// Initialize declaredClass, so that toString() works properly on such objects.
	// Correct operation of toString() is required for proper wrapping and automated testing.
	filter.prototype.declaredClass = 'Tizen.CompositeFilter';
	return filter;
});
