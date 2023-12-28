/**
 * Placeholder plugin for tinyMCE editor - Version 6
 *
 * @author S.Kientzler <s.kientzler@online.de>
 * @link https://github.com/Stefanius67/tinyMCE-Placeholder
 */

tinymce.PluginManager.add('placeholder', function(editor, url){
    // first step is to register all of our 'own' options
    // 1. the placeholder list
    const placeholdersOptionProcessor = function(value) {
        // @todo: check the array elements:
        // - string (value only)
        // - object containing value [required] and text [optional] property
        return Array.isArray(value);
    };
	editor.options.register('placeholders', {
		processor: placeholdersOptionProcessor,
		default: [],
	});
    // 2. the placeholder type (open/close tag)
    //    - default value is 'double square braces'
    const placeholderTypes = {
        curly_braces: {               // {placeholder}
            openTag:    '{',
            closeTag:   '}',
            noneditableRegExp: /\{[^\}]*\}/g,
            selectedRegExp:    /^\{([^\}]*)\}$/,
        },
        square_braces: {              // [placeholder]
            openTag:    '[',
            closeTag:   ']',
            noneditableRegExp: /\[[^\]]*\]/g,
            selectedRegExp:    /^\[([^\]]*)\]$/,
        },
        double_curly_braces: {        // {{placeholder}}
            openTag:    '{{',
            closeTag:   '}}',
            noneditableRegExp: /\{\{[^\}]*\}\}/g,
            selectedRegExp:    /^\{\{([^\}]*)\}\}$/,
        },
        double_square_braces: {       // [[placeholder]]  (default)
            openTag:    '[[',
            closeTag:   ']]',
            noneditableRegExp: /\[\[[^\]]*\]\]/g,       	       // use braces to hide the open/close tag: /\[\[([^\]]*)\]\]/g,
            selectedRegExp:    /^\[\[([^\]]*)\]\]$/,
        },
        curly_brace_exclamation: {    // {!placeholder!}
            openTag:    '{!',
            closeTag:   '!}',
            noneditableRegExp: /\{\![^\!][^\}]*\!\}/g,
            selectedRegExp:    /^\{\!([^\!][^\}]*)\!\}$/,
        },
        square_brace_exclamation: {   // [!placeholder!]
            openTag:    '[!',
            closeTag:   '!]',
            noneditableRegExp: /\[\![^\!][^\]]*\!\]/g,
            selectedRegExp:    /^\[\!([^\!][^\]]*)\!\]$/,
        },
    };
    const placeholderTypeOptionProcessor = function(value) {
        if (!(value in placeholderTypes)) {
            console.error('Invalid placeholder_type [' + value + '] passed to the tinyMCE editor!')
            return false;
        }
        return true;
    };
	editor.options.register('placeholder_type', {
		processor: placeholderTypeOptionProcessor,
		default: 'double_square_braces',
	});
    
    // the type is needed to add the regexp for noneditable content
    const placeholderType = placeholderTypes[editor.options.get('placeholder_type')];
    
	var noneditableRegExp = editor.options.get('noneditable_regexp');
	noneditableRegExp.push(placeholderType.noneditableRegExp);

    // 3. the style to display the readonly placeholders
    //    - default is darkblue text on yellow background
	editor.options.register('placeholder_style', {
		processor: 'string',
		default: '{ color: darkblue; background-color: yellow;}',
	});
    
    // since we use the 'noneditable' function of tinyMCE we can set the
    // CSS class '.mceNonEditable' to change the display of the placeholders...
    var placeholderStyle = editor.options.get('placeholder_style');
    if (placeholderStyle != '') {
        var content_style = editor.options.get('content_style');
        if (typeof content_style == 'undefined') {
            content_style = '';
        }
        content_style += '.mceNonEditable ' + placeholderStyle
        editor.options.set('content_style', content_style);
    }
    
    // 4. Check, if it is allowed to edit existing placeholders
    //    - default is true
	editor.options.register('placeholder_can_edit', {
		processor: 'boolean',
		default: true,
	});
    var placeholderCanEdit = editor.options.get('placeholder_can_edit');

    // .. and now process the passed placeholder list
	var placeholderItems = editor.options.get('placeholders');
	var placeholderMenu = [];
	
	for (var i in placeholderItems) {
		if ('object' === typeof placeholderItems[i] && placeholderItems[i].value) {
            // assign to a const in this block scope - otherwise, the onAction - handler 
            // will use the last value from the for - loop!
            const value = placeholderType.openTag + placeholderItems[i].value + placeholderType.closeTag;
			placeholderMenu.push({
				type:		'menuitem',
				text:		placeholderItems[i].text || placeholderItems[i].value,
				onAction:	() => { 
                    editor.insertContent(value.slice(0));
                },
			});
		} else if('string' === typeof placeholderItems[i]) {
			// assign to a const in this block scope - otherwise, the onAction - handler 
			// will use the last value from the for - loop!
			const value = placeholderType.openTag + placeholderItems[i] + placeholderType.closeTag;
			placeholderMenu.push({
				type:		'menuitem',
				text:		placeholderItems[i],
				onAction:	() => { 
                    editor.insertContent(value.slice(0));
                },
			});
		}
	}
	
    if (placeholderMenu.length > 0) {
        editor.ui.registry.addMenuButton('placeholder', {
            text: 'Placeholders',
            fetch: (callback) => { callback(placeholderMenu); },
        });
    }
	
    if (placeholderCanEdit) {
        editor.on('dblclick', () => {
            const strSelection = editor.selection.getContent();
            const matches = strSelection.match(placeholderType.selectedRegExp);
            if (matches !== null) {
                // console.log('Placeholder: ' + matches[0] + ' dbl-clicked');
                editPlaceholder(matches[1]);
            }
        });
	}
	const editPlaceholder = function(strPlaceholder) {
		editor.windowManager.open({
			title: 'Edit placeholder value',
			body: {
				type: 'panel',
				items: [{
					type: 'input',
					name: 'placeholder',
					label: 'Current value',
					placeholder: 'test',
				}]
			},
			buttons: [{
				type: 'cancel',
				text: 'Close',
			},{
				type: 'submit',
				text: 'Save',
				buttonType: 'primary',
			}],
			initialData: {
				placeholder: strPlaceholder,
			},			
			onSubmit: (api) => {
				const data = api.getData();
				editor.insertContent(placeholderType.openTag + data.placeholder + placeholderType.closeTag);
				api.close();
			},
		});	
	};
});

/**
 * at first step only the german translation is available
 */
tinymce.PluginManager.requireLangPack('placeholder', 'de');
