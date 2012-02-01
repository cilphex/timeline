// main.js

$(function() {

	var Data = {
		time: {
			seconds_per: {
				minute: 60,
				hour:   3600,
				day:    86400,
				week:   604800,
				month:  2419200,
				year:   31536000
			}
		}
	};

	var Defaults = {
		event_title: 'No title',
		min_width: 100,
		max_width: 800
	};

	var Event = function(el) {
		
		this.el = el;
		this.opts = {};
		this.time_info = {};

		this.initialize = function() {
			this.parseData();
			this.setupTimeInfo();
		};

		this.parseData = function() {
			$(this.el).find('> input').each(function(i, input) {
				this.opts[$(input).attr('name')] = input.value;
			}.bind(this));
		};

		this.setupTimeInfo = function() {
			var start = this.opts.start;
			var end = this.opts.end;
			if (start) {
				var sd1 = start.match(/(\d+)\/(\d+)\/(\d+)/);
				var sd2 = start.match(/(\d+)\/(\d+)/);
				if (sd1)
					this.time_info.start = Math.round(new Date(sd1[3], sd1[1]-1, sd1[2]).valueOf() / 1000);
				else if (sd2)
					this.time_info.start = Math.round(new Date(sd2[2], sd2[1]-1).valueOf() / 1000);
				else
					this.time_info.start = null;
			}
			if (end) {
				var ed1 = end.match(/(\d+)\/(\d+)\/(\d+)/);
				var ed2 = end.match(/(\d+)\/(\d+)/);
				if (ed1)
					this.time_info.end = Math.round(new Date(ed1[3], ed1[1]-1, ed1[2]).valueOf() / 1000);
				else if (ed2)
					this.time_info.end = Math.round(new Date(ed2[2], ed2[1]-1).valueOf() / 1000);
				else
					this.time_info.end = null;
			}
		};

		this.initialize();
	};

	var Timeline = function(el) {

		this.el = el;
		this.opts = {};
		this.events = [];
		this.time_info = {};
		this.timespan = null;
		this.point = null;

		this.defaults = {
			years: 5
		};

		this.initialize = function() {
			this.parseData();
			this.setupTimeInfo();
			this.drawMarkers();
			this.drawEvents();
			this.setupListeners();
		};

		this.parseData = function() {
			this_el = $(this.el);
			this.opts.min_width = this_el.attr('minwidth') || Defaults.min_width;
			this.opts.max_width = this_el.attr('maxwidth') || Defaults.max_width;
			this_el.find('> input').each(function(i, input) {
				this.opts[$(input).attr('name')] = input.value;
			}.bind(this));
			this_el.find('> .event').each(function(i, el) {
				this.events.push(new Event(el));
			}.bind(this));
		};

		this.setupTimeInfo = function() {
			var years = this.opts.years || this.defaults.years;
			this.time_info.end = Math.round(new Date().valueOf() / 1000);
			this.time_info.span = years * Data.time.seconds_per.year;
			this.time_info.start = this.time_info.end - this.time_info.span;
		};

		this.setupListeners = function() {
			if ($(this.el).attr('resizable') != 'true')
				return;
			$(this.el)
				.mousedown(this.mouseDown.bind(this))
				.mousemove(this.mouseMove.bind(this))
				.mouseout(this.mouseUp.bind(this))
				.mouseup(this.mouseUp.bind(this));
		};

		this.mouseDown = function(e) {
			this.point = {
				x: e.offsetX,
				y: e.offsetY
			};
		};

		this.mouseMove = function(e) {
			if (!this.point)
				return;
			var width = $(this.el).width();
			var last_point = this.point;
			this.point = {
				x: e.offsetX,
				y: e.offsetY
			};
			var scale = this.point.x / last_point.x;
			var new_width = Math.round(width * scale);
			if (new_width < this.opts.min_width) new_width = this.opts.min_width;
			if (new_width > this.opts.max_width) new_width = this.opts.max_width;
			$(this.el).width(new_width);
		};

		this.mouseUp = function(e) {
			this.point = null;
		};

		this.drawMarkers = function() {
			// Find what years fall into our time span and insert a bar for each
			var current_year = new Date().getFullYear(); // new Date(new Date().getFullYear(), 1, 1);
			var years_back = 0;
			var going_back = true;

			while (going_back) {
				var year = current_year - years_back++;
				var year_date = Math.round(new Date(year, 0, 1).valueOf() / 1000);

				if (year_date >= this.time_info.start && year_date <= this.time_info.end) {
					var offset_as_percent = Math.floor(((year_date - this.time_info.start) / this.time_info.span) * 100);
					// Figure out how to template this
					$('<div class="bar"><span>' + year + '</span></div>')
						.css({left: offset_as_percent + '%'})
						.appendTo(this.el);
				}
				else {
					going_back = false;
				}
			}
		};

		this.drawEvents = function() {
			$(this.events).each(function(i, e) {
				this.drawEvent(e);
			}.bind(this));
		};

		this.drawEvent = function(e) {
			if ($(e.el).attr('drawn')
			    || (e.time_info.end && e.time_info.end < this.time_info.start)
			    || (e.time_info.start && e.time_info.start > this.time_info.end))
				return;
			
			var event_el = $(e.el);
			var start = e.time_info.start ? Math.max(e.time_info.start, this.time_info.start) : this.time_info.start;
			var end = e.time_info.end ? Math.min(e.time_info.end, this.time_info.end) : this.time_info.end;
			var event_span = end - start;
			var width_as_percent = Math.ceil((event_span / this.time_info.span) * 100);
			var offset_as_percent = Math.floor(((start - this.time_info.start) / this.time_info.span) * 100);
			var right_margin_as_percent = (100 - width_as_percent - offset_as_percent);
			var title = e.opts.title || Defaults.event_title;

			event_el
				.css({
					marginLeft: offset_as_percent + '%',
					marginRight: right_margin_as_percent + '%',
					width: width_as_percent + '%'
				})
				.attr('drawn', 'true')
				.attr('title', title)
				.append('<p>' + title + '</p>')  // figure out how to template this
		};

		this.initialize();
	};

	var Main = {

		timelines: [],

		initialize: function() {
			this.setupTimelines();
		},
		setupTimelines: function() {
			$('div.timeline[render=true]').each(function(i, el) {
				this.timelines.push(new Timeline(el));
			}.bind(this));
		}
	};

	window.Main = Main;

	Main.initialize();

});

