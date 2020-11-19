import Component from '@ember/component';
import { guidFor } from '@ember/object/internals';
import layout from '../templates/components/tinymce-ember';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend({
  layout,

  currentContent: '',
  editor: null,
  editorContent: '',
  editorId: null,
  editorName: 'tinymce',

  init() {
    this._super(...arguments);

    // Generate and set editor's id for textarea
    const EditorId = `${this.editorName}-${guidFor(this)}`
      .replaceAll(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    this.set('editorId', EditorId);

    // Run editor initialisation once page is rendered
    scheduleOnce('afterRender', this, this.initEditor);
  },

  willDestroyElement() {
    this._super(...arguments);

    const Editor = this.editor;
    if (Editor) {
      Editor.off('change keyup setcontent', this.handleEditorChange.bind(this));

      if (this.customEvents) {
        this.customEvents.forEach(event => {
          Editor.off(event.name, event.handler);
        });
      }
    }
  },

  handleEditorChange() {
    const Editor = this.editor;
    if (Editor) {
      const NewContent = Editor.getContent({format: 'html'});

      if (this.currentContent !== NewContent) {
        this.set('currentContent', NewContent);
      }
    }
  },

  handleEditorInit() {
    const Editor = this.editor;
    if (Editor) {
      this.set('currentContent', this.editorContent);
      Editor.setContent(this.editorContent);

      Editor.on('change keyup setcontent', this.handleEditorChange.bind(this));

      if (this.customEvents) {
        this.customEvents.forEach(event => {
          Editor.on(event.name, event.handler);
        });
      }
    }
  },

  initEditor() {
    // Importing tinymce module in your web page will run an IIFE that attaches tinymce to the window
    if (!window.tinymce) {
      throw('TinyMCE hasn\'t been attached to the window hence not imported in your application.');
    }

    // Extend default and custom configurations
    const Config = {
      ...this.config,
      selector: `#${this.editorId}`,
      setup: editor => {
        this.set('editor', editor);
        editor.on('init', this.handleEditorInit.bind(this));

        if (this.config.setup && typeof this.config.setup === 'function') {
          this.config.setup(editor);
        }
      }
    }

    window.tinymce.init(Config);
  }
});
