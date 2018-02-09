/* eslint-disable no-param-reassign */

import Vue from 'vue';
import Vuex from 'vuex';

import views from '../router/views';

import auth from './auth';
import contao from './contao';
import server from './server';
import tasks from './tasks';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: { auth, contao, server, tasks },

    state: {
        view: views.INIT,
        error: null,
        contaoVersion: null,
        apiVersion: null,
    },

    mutations: {
        setView(state, view) {
            state.view = view;
        },

        setError(state, error) {
            if (state.error === null) {
                state.error = error;
            }
        },

        setVersions(state, result) {
            state.contaoVersion = result.version;
            state.apiVersion = result.api;
        },
    },

    actions: {
        apiError: ({ commit }, statusCode) => {
            commit('setError', {
                title: Vue.i18n.translate('ui.app.apiError'),
                type: 'about:blank',
                status: statusCode || '',
            });
        },

        install: ({ dispatch }, version) => {
            const task = {
                name: 'contao/install',
                config: {
                    version,
                },
            };

            return Vue.http.patch(
                'api/config/composer',
                {
                    'preferred-install': 'dist',
                    'store-auths': false,
                    'optimize-autoloader': true,
                    'sort-packages': true,
                    'discard-changes': true,
                },
            ).then(() => dispatch('tasks/execute', task, { root: true }));
        },
    },
});

export default store;
