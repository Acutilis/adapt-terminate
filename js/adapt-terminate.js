define([ "coreJS/adapt" ], function(Adapt) {

var TerminateView = Backbone.View.extend({

    initialize: function() {
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
        Adapt.trigger('navigation:terminate');
        // this is the only place that I know that 'terminate' was issued
        // should disable the whole site (gray transparent overlay on top of everything) AND 
        // start a timer... after a second or so, navigate... this is because the architecture is shaky
        // the overlay and its style are part of this extension...
        console.log('JUST TRIGGERED terminate...');
    }

    onComposeTerminateXapiMessage(statement, args) {
        alert('COMPOSING message for TERMINATE');
        // visited page
        statement.verb = ADL.verbs.terminated;
        var activityId = this.xapiChannel._LaunchData['activityId'];
        if (! activityId) {
            activityId = Adapt.trackingHub._config._courseID;
        }
        statement.object = new ADL.XAPIStatement.Activity(activityID);
        var objKey = Adapt.trackingHub.getElementKey(args);
        var ATB = this.xapiChannel._handler.msgComposer._ATB;
        var t = args.get('_type');
        statement.object.definition = {type: ATB + t, name: { 'en-US': objKey }};
    },

});

function onBeforeUnload(config) {
    // HERE just send terminate
    Adapt.trigger('navigation:terminate');
}

Adapt.once("adapt:initialize", function() {
    // here, add customeEventListener to trackinghub
    var config = Adapt.course.get("_terminate");

    if (!config || !config._isEnabled) return;

    var button = config._button;

    if (button && button._isEnabled) {
        var termView = new TerminateView({ model: new Backbone.Model(button) });

        // tell trackingHub to listen to our event
        Adapt.trackingHub.addCustomEventListener('Adapt', 'navigation:terminate');
 
        // find the xAPI channels and add our composing function to them
        _.each(Adapt.trackingHub._channels, function(channel) {
            if (channel._handler._CHID == 'xapiChannelHandler') {
                termView.xapiChannel = channel;
            }
        }, this);

        // tell the xAPI channel to use our custom composing function
        termView.xapiChannel._handler.msgComposer.addCustomComposingFunction('Adapt', 'navigation:terminate', termView.onComposeTerminateXapiMessage)


    }

        if (config.browserPrompt) {
            $(window).on("beforeunload", _.partial(onBeforeUnload, config));
        }
    });

});
