const util = require("util");
const MqttHandler = require("../../MqttHandler");

/**
 * @param options {object}
 * @constructor
 */
const MiKettleMqttHandler = function MiKettleMqttHandler(options) {
    MqttHandler.call(this, options);

    this.registerTopicHandler("set_keep_warm_parameters", cmd => this.setKeepWarmParameters(cmd));
    this.registerTopicHandler("set_keep_warm_time_limit", cmd => this.setKeepWarmTimeLimit(cmd));
    this.registerTopicHandler("set_keep_warm_refill_mode", cmd => this.setKeepWarmRefillMode(cmd));

    this.lastState = null;
};

util.inherits(MiKettleMqttHandler, MqttHandler);

MiKettleMqttHandler.prototype.updateState = function(state) {
    const stringifiedState = JSON.stringify(state);

    if(stringifiedState !== this.lastState) {
        this.lastState = stringifiedState;

        this.updatePresence(true);
        this.mqttClient.publish(this.writableTopics.state, state.current_temperature.toString(), {retain: true}, err => {
            if(err) {
                console.error(err);
            }
        });
        this.mqttClient.publish(this.writableTopics.attributes, JSON.stringify({
            action: state.action,
            mode: state.mode,
            keep_warm_refill_mode: state.keep_warm_refill_mode,
            keep_warm_temperature: state.keep_warm_set_temperature,
            keep_warm_type: state.keep_warm_type,
            keep_warm_time: state.keep_warm_time,
            keep_warm_time_limit: state.keep_warm_time_limit
        }), {retain: true}, err => {
            if(err) {
                console.error(err);
            }
        });
    }
};

/**
 * @param cmd {object}
 * @param cmd.mode {"boil"|"heat"}
 * @param cmd.temperature {number}
 */
MiKettleMqttHandler.prototype.setKeepWarmParameters = function(cmd) {
    const mode = MiKettleMqttHandler.KEEP_WARM_MODES[cmd.mode];
    const temp = cmd.temperature;

    if(mode !== undefined && temp >= 40 && temp <= 90) {
        this.device.setKeepWarmParameters(mode, temp, err => {
            if(err) {
                console.error(err);
            }
        });
    }
};

/**
 *
 * @param cmd {object}
 * @param cmd.time {number}
 */
MiKettleMqttHandler.prototype.setKeepWarmTimeLimit = function(cmd) {
    const time = Math.round(cmd.time * 2);

    if(time >= 0 && time <= 24) {
        this.device.setKeepWarmTimeLimit(time, err => {
            if(err) {
                console.error(err);
            }
        })
    }
};

/**
 *
 * @param cmd {object}
 * @param cmd.mode {"turn_off"|"keep_warm"}
 */
MiKettleMqttHandler.prototype.setKeepWarmRefillMode = function(cmd) {
    const mode = MiKettleMqttHandler.KEEP_WARM_REFILL_MODE[cmd.mode];

    if(mode !== undefined) {
        this.device.setKeepWarmRefillMode(mode, err => {
            if(err) {
                console.error(err);
            }
        })
    }
};

MiKettleMqttHandler.KEEP_WARM_MODES = {
    "boil": 0,
    "heat": 1
};

MiKettleMqttHandler.KEEP_WARM_REFILL_MODE = {
    "turn_off": 1,
    "keep_warm": 0
};


module.exports = MiKettleMqttHandler;
