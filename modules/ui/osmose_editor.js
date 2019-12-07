import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { modeSelectError } from '../modes/select_error';

import { uiOsmoseDetails } from './osmose_details';

import { utilNoAuto } from '../util';


export function uiOsmoseEditor(context) {
    var errorDetails = uiOsmoseDetails(context);

    var _error;

    function osmoseEditor(selection) {

        var body = selection.selectAll('.inspector-body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'inspector-body sep-top')
            .merge(body);

        var editor = body.selectAll('.error-editor')
            .data([0]);

        editor.enter()
            .append('div')
            .attr('class', 'modal-section error-editor')
            .merge(editor)
            .call(errorDetails.error(_error))
            .call(osmoseSaveSection);
    }

    function osmoseSaveSection(selection) {
        var isSelected = (_error && context.mode().selectedErrorID && _error.id === context.mode().selectedErrorID());
        var isShown = (_error && isSelected);
        var saveSection = selection.selectAll('.error-save')
            .data(
                (isShown ? [_error] : []),
                function(d) { return d.id + '-' + (d.status || 0); }
            );

        // exit
        saveSection.exit()
            .remove();

        // enter
        var saveSectionEnter = saveSection.enter()
            .append('div')
            .attr('class', 'error-save save-section cf');

        // update
        saveSection = saveSectionEnter
            .merge(saveSection)
            .call(errorSaveButtons);
    }

    function errorSaveButtons(selection) {
        var isSelected = (_error && context.mode().selectedErrorID && _error.id === context.mode().selectedErrorID());
        var buttonSection = selection.selectAll('.buttons')
            .data((isSelected ? [_error] : []), function(d) { return d.status + d.id; });

        // exit
        buttonSection.exit()
            .remove();

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons');

        buttonEnter
            .append('button')
            .attr('class', 'button close-button action');

        buttonEnter
            .append('button')
            .attr('class', 'button ignore-button action');


        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.select('.close-button')
            .text(function(d) {
                return t('QA.keepRight.close');
            })
            .on('click.close', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.osmose;
                if (errorService) {
                    d.newStatus = '/done';
                    errorService.postUpdate(d, remoteUpdateCallback);
                }
            });

        buttonSection.select('.ignore-button')
            .text(function(d) {
                return t('QA.keepRight.ignore');
            })
            .on('click.ignore', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.osmose;
                if (errorService) {
                    d.newStatus = '/false';
                    errorService.postUpdate(d, remoteUpdateCallback);
                }
            });
    }

    function remoteUpdateCallback(err, error) {
        context.map().pan([0,0]);  // trigger a redraw

        if (err || !error || !error.id) {
            context.enter(modeBrowse(context));
        } else {
            context.enter(modeSelectError(context, error.id, 'osmose'));
        }
    }

    osmoseEditor.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return osmoseEditor;
    };


    return osmoseEditor;
}