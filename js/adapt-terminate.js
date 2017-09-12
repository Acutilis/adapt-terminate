define([ "coreJS/adapt" ], function(Adapt) {

var TerminateView = Backbone.View.extend({

    initialize: function() {
        _.bindAll(this, 'onComposeTerminateXapiMessage','onTerminateConfirm');
        this.listenTo(Adapt, {
            "navigation:terminateClick": this.onTerminateClick,
            "terminate:confirm": this.onTerminateConfirm
        }).render();
    },

    render: function() {
        var data = this.model.toJSON();
        data._globals = Adapt.course.get("_globals");

        var template = Handlebars.templates.terminate;
        this.setElement(template(data)).$el.prependTo($(".navigation-inner"));
    },

    onTerminateClick: function() {
        var prompt = this.model.get("_notifyPrompt");

        if (!prompt || !prompt._isEnabled) return Adapt.trigger("terminate:confirm");

        Adapt.trigger("notify:prompt", {
            title: prompt.title,
            body: prompt.body,
            _prompts: [
                {
                    promptText: prompt.confirm,
                    _callbackEvent: "terminate:confirm"
                },
                {
                    promptText: prompt.cancel
                }
            ]
        });
    },

    onTerminateConfirm: function() {
        Adapt.trigger('navigation:terminate', Adapt.course);
        var config = Adapt.course.get("_terminate");
        var returnURL;
        if (this.xapiChannel._LaunchData) {
          returnURL = this.xapiChannel._LaunchData['returnURL'];
        } else {
            returnURL = config['fallbackReturnURL'];
        }
        setInterval(function(){ window.location.href = returnURL; }, 750);
        Adapt.trigger("notify:prompt", {
            title: 'Terminating...',
            body: 'Please wait while course terminates...',
            _prompts: [
            ]
        });
    },

    onComposeTerminateXapiMessage(statement, args) {
        statement.verb = ADL.verbs.terminated;
        var activityId;
        if (this.xapiChannel._LaunchData) {
          activityId = this.xapiChannel._LaunchData['activityId'];
        } else {
            activityId = Adapt.trackingHub._config._courseID;
        }
        statement.object = new ADL.XAPIStatement.Activity(activityId);
        var objKey = Adapt.trackingHub.getElementKey(args);
        var ATB = this.xapiChannel._handler._COMPOSER._ATB;
        var t = args.get('_type');
        statement.object.definition = {type: ATB + t, name: { 'en-US': 'course' }};
    },

});

function onBeforeUnload(config) {
    Adapt.trigger('navigation:terminate');
}

Adapt.once("adapt:initialize", function() {
    var config = Adapt.course.get("_terminate");

    if (!config || !config._isEnabled) return;

    var button = config._button;

    if (button && button._isEnabled) {
        var termView = new TerminateView({ model: new Backbone.Model(button) });

        // tell trackingHub to listen to our event
        Adapt.trackingHub.addCustomEventListener(Adapt, 'Adapt', 'navigation:terminate');
        // find the xAPI channels and add our composing function to them
        _.each(Adapt.trackingHub._channels, function(channel) {
            if (channel._handler._CHID == 'xapiChannelHandler') {
                termView.xapiChannel = channel;
            }
        }, this);

        // tell the xAPI channel to use our custom composing function
        termView.xapiChannel._handler._COMPOSER.addCustomComposingFunction('Adapt', 'navigation:terminate', termView.onComposeTerminateXapiMessage)


    }

        if (config.browserPrompt) {
            $(window).on("beforeunload", _.partial(onBeforeUnload, config));
        }
    });

});
