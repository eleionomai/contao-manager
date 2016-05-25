'use strict';

const React         = require('react');
const forEach       = require('lodash/forEach');
const Highlight     = require('react-highlighter');
const Translation   = require('../translation.js');
const request       = require('../../helpers/request.js');
const isEqual       = require('lodash/isEqual');

var PackageComponent = React.createClass({

    initialConstraint: null,

    getInitialState: function() {

        this.initialConstraint = this.props.constraint;

        return {
            removed: false,
            installed: false,
            enabled: this.props.enabled,
            constraint: this.initialConstraint,
            constraintInputDisabled: true
        };
    },

    shouldComponentUpdate: function(nextProps, nextState) {

        return !isEqual(nextProps, this.props) || !isEqual(nextState, this.state);
    },

    componentDidUpdate: function(prevProps, prevState) {

        if (undefined === this.props.onModified) {
            return;
        }

        var wasModified = false;

        if (this.state.removed !== false
            || this.state.installed !== false
            || this.state.enabled !== this.props.enabled
            || this.state.constraint !== this.initialConstraint
        ) {
            wasModified = true;
        }

        this.props.onModified.call(this, {
            package: this.props.name,
            modified: wasModified,
            removed: this.state.removed,
            enabled: this.state.enabled,
            installed: this.state.installed,
            constraint: this.state.constraint
        });
    },

    handleRemoveButton: function(e) {
        this.setState({
            removed: true
        });
    },

    handleInstallButton: function(e) {
        this.setState({
            installed: true
        });
    },

    handleEnableOrDisableButton: function(e) {
        this.setState({
            enabled: !this.state.enabled
        });
    },

    handleConstraintChange: function(newConstraint) {
        this.setState({
            constraint: newConstraint
        });
    },

    getFormattedReleaseDate: function() {
        if (undefined === this.props.time) {
            return '';
        }

        var date = new Date(this.props.time);
        return date.toLocaleDateString() + ' (' + date.toLocaleTimeString() + ')';
    },

    getHintMessageData: function() {
        if (this.state.removed && this.state.constraint !== this.initialConstraint) {
            return ['You marked this package for removal and also changed the constraint. Note that changing the constraint will not have any effect, as the package will be removed.'];
        } else if (this.state.removed) {
            return ['You marked this package for removal. The package will only be removed when you apply the changes.'];
        } else if (this.state.constraint !== this.initialConstraint) {
            return ['You changed the constraint of this package form "%old_constraint%" to "%new_constraint%". The package will only be updated when you apply the changes.',
                {
                    old_constraint: this.initialConstraint,
                    new_constraint: this.state.constraint
                }];
        } else {
            return [''];
        }
    },

    render: function() {
        var hint = '';
        var release = '';
        var hintData = this.getHintMessageData();
        if ('' !== hintData[0]) {
            hint = <HintComponent><Translation domain="package" placeholders={hintData[1]}>{hintData[0]}</Translation></HintComponent>
        }

        if ('packages' === this.props.mode) {
            release = (
                <ReleaseComponent
                    initialConstraint={this.initialConstraint}
                    constraint={this.state.constraint}
                    onConstraintChange={this.handleConstraintChange}
                />
            );
        }

        var licenses = [];
        forEach(this.props.licenses, function(license) {
            licenses.push(license);
        });

        return (
            <section className="package">

                {hint}

                <div className="inside">
                    <figure><img src="" width="110" height="110" /></figure>

                    <div className="about">
                        <h1><Highlight search={this.props.keywords} matchElement="mark">{this.props.name}</Highlight></h1>
                        <p className="description"><Highlight search={this.props.keywords} matchElement="mark">{this.props.description}</Highlight></p>
                        <p className="additional">
                            <Translation domain="package">Licenses</Translation>: {licenses.join(', ')}
                            &nbsp;&nbsp; | &nbsp;&nbsp;
                            <Translation domain="package">Released on</Translation>: {this.getFormattedReleaseDate()}
                            &nbsp;&nbsp; | &nbsp;&nbsp;
                            <Translation domain="package">Installed version</Translation>: {this.props.installed}
                        </p>
                    </div>

                    {release}

                    <ActionsComponent
                        canBeRemoved={this.props.canBeRemoved}
                        onRemove={this.handleRemoveButton}
                        isRemoved={this.state.removed}
                        canBeInstalled={this.props.canBeInstalled}
                        onInstall={this.handleInstallButton}
                        isInstalled={this.state.installed}
                        canBeEnabledOrDisabled={this.props.canBeEnabledOrDisabled}
                        onEnableOrDisable={this.handleEnableOrDisableButton}
                        isEnabled={this.state.enabled}
                    />

                </div>
            </section>
        );
    }
});

var ActionsComponent = React.createClass({
    render: function() {

        var buttons = [];

        if (this.props.canBeRemoved) {
            buttons.push(
                <button key="remove" className="uninstall" onClick={this.props.onRemove} disabled={this.props.isRemoved}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90.8 105.6"><path d="M0 8.3h31.8V0H59v8.3h31.8v12.5H0V8.3zm8.3 17.8h75.8v79.5H8.3m64-70.7h-7.6v62.8h7.5l.1-62.8zm-22.7 0h-7.5v62.8h7.5V34.9zm-22.8.5h-7.5v62.8h7.5V35.4z"/></svg>
                    Remove
                </button>
            );
        }

        if (this.props.canBeInstalled) {
            buttons.push(
                <button key="install" className="install" onClick={this.props.onInstall} disabled={this.props.isInstalled}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90.8 105.6"><path d="M0 8.3h31.8V0H59v8.3h31.8v12.5H0V8.3zm8.3 17.8h75.8v79.5H8.3m64-70.7h-7.6v62.8h7.5l.1-62.8zm-22.7 0h-7.5v62.8h7.5V34.9zm-22.8.5h-7.5v62.8h7.5V35.4z"/></svg>
                    Install
                </button>
            );
        }

        if (this.props.canBeEnabledOrDisabled) {
            if (this.props.isEnabled) {
                buttons.push(
                    <button key="disable" className="disable">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 448"><path className="st0" d="M320 256c0-47.4-25.7-88.7-64-110.9V74.9c74.6 26.4 128 97.5 128 181.1 0 106-86 192-192 192S0 362 0 256c0-83.6 53.4-154.7 128-181.1v70.2C89.7 167.3 64 208.6 64 256c0 70.7 57.3 128 128 128s128-57.3 128-128zm-160-64V32c0-17.7 14.3-32 32-32s32 14.3 32 32v160c0 17.7-14.3 32-32 32s-32-14.3-32-32z"/></svg>
                        Disable
                    </button>
                );
            } else {
                buttons.push(
                    <button key="enable" className="enable">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 448"><path className="st0" d="M320 256c0-47.4-25.7-88.7-64-110.9V74.9c74.6 26.4 128 97.5 128 181.1 0 106-86 192-192 192S0 362 0 256c0-83.6 53.4-154.7 128-181.1v70.2C89.7 167.3 64 208.6 64 256c0 70.7 57.3 128 128 128s128-57.3 128-128zm-160-64V32c0-17.7 14.3-32 32-32s32 14.3 32 32v160c0 17.7-14.3 32-32 32s-32-14.3-32-32z"/></svg>
                        Enable
                    </button>
                );
            }
        }

        return (
            <fieldset className="actions">{buttons}</fieldset>
        )
    }
});

var HintComponent = React.createClass({
    render: function() {
        return (
            <div className="warning hint">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80.1 71.6">
                    <path d="M79.1 59.6L47 4c-1.4-2.5-4.1-4-6.9-4s-5.5 1.5-6.9 4L1.1 59.6c-1.4 2.5-1.4 5.5 0 8s4.1 4 6.9 4h64.1c2.9 0 5.5-1.5 6.9-4 1.5-2.5 1.5-5.6.1-8zM8 63.6L40 8l32.1 55.5-64.1.1z" />
                    <path d="M36 26.5v16.7c0 2.2 1.8 4 4 4s4-1.8 4-4V26.5c0-2.2-1.8-4-4-4s-4 1.8-4 4z" />
                    <circle cx="40" cy="54.3" r="4" />
                </svg>
                <p>{this.props.children}</p>
            </div>
        )
    }
});

var ReleaseComponent = React.createClass({

    getInitialState: function() {
        return {
            constraint: this.props.constraint,
            constraintInputDisabled: true
        };
    },

    componentDidUpdate: function(prevProps, prevState) {
        this.refs.constraintInput.focus();
    },

    handleEnableConstraintInput: function() {
        this.setState({constraintInputDisabled: false});
    },

    handleDisableConstraintInput: function() {
        this.setState({constraintInputDisabled: true});
    },

    handleConstraintBlur: function(e) {
        this.handleDisableConstraintInput();
        this.validateConstraint();
    },

    handleConstraintChange: function(e) {
        this.setState({constraint: e.target.value});
    },

    handleConstraintKey: function(e) {
        if ('Enter' == e.key) {
            this.handleConstraintBlur();
        } else if ('Escape' == e.key) {
            this.setState({constraint: this.props.constraint});
            this.handleConstraintBlur();
        }
    },

    fireConstraintChangeEvent: function(newConstraint) {
        if (undefined !== this.props.onConstraintChange) {
            this.props.onConstraintChange.call(this, newConstraint);
        }
    },

    validateConstraint: function() {
        var self = this;

        request.createRequest('/api/v1/constraint', {
            method: 'POST',
            data: JSON.stringify({constraint: self.state.constraint}),
            dataType: 'json'
        }).then(function(response) {
            if ('OK' !== response.status) {
                self.setState({constraint: self.props.initialConstraint});
                self.fireConstraintChangeEvent(self.props.initialConstraint);
            } else {
                self.fireConstraintChangeEvent(self.state.constraint);
            }
        }).catch(function() {
            // @todo: what if request failed?
        });
    },

    render: function() {

        return (
            <div className="release">
                <fieldset>
                    <input type="text" ref="constraintInput" value={this.state.constraint} onBlur={this.handleConstraintBlur} onChange={this.handleConstraintChange} onKeyUp={this.handleConstraintKey} disabled={this.state.constraintInputDisabled} />
                    <button onClick={this.handleEnableConstraintInput}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                            <path d="M88.1 50c0-1.2-.1-2.4-.2-3.5l12.1-7c-.7-3.4-1.8-6.7-3.2-9.8L82.9 31c-1.2-2-2.7-4-4.3-5.7l5.6-12.5c-2.6-2.3-5.5-4.3-8.5-6.1l-10.5 9.1c-2.2-.9-4.5-1.7-6.9-2.2L55.3.3a47.08 47.08 0 0 0-10.6 0l-3 13.3c-2.4.5-4.7 1.3-6.9 2.2L24.3 6.7c-3.1 1.7-5.9 3.8-8.5 6.1l5.6 12.5c-1.6 1.8-3 3.7-4.3 5.7L3.2 29.7C1.8 32.8.7 36.1 0 39.5l12.1 6.9c-.1 1.2-.2 2.3-.2 3.5s.1 2.4.2 3.5L0 60.5c.7 3.4 1.8 6.7 3.2 9.8L17.1 69c1.2 2 2.7 4 4.3 5.7l-5.6 12.5c2.6 2.3 5.5 4.3 8.5 6.1l10.5-9.1c2.2.9 4.5 1.7 6.9 2.2l3 13.3a47.08 47.08 0 0 0 10.6 0l3-13.3c2.4-.5 4.7-1.3 6.9-2.2l10.5 9.1c3.1-1.7 5.9-3.8 8.5-6.1l-5.6-12.5c1.6-1.8 3-3.7 4.3-5.7l13.9 1.3c1.4-3.1 2.5-6.4 3.2-9.8l-12.1-6.9c.2-1.2.2-2.4.2-3.6zM50 66.4c-9.2 0-16.7-7.3-16.7-16.4 0-9 7.5-16.4 16.7-16.4S66.7 40.9 66.7 50c0 9-7.5 16.4-16.7 16.4z"/>
                        </svg>
                    </button>
                </fieldset>
            </div>
        )
    }
});

module.exports = PackageComponent;
