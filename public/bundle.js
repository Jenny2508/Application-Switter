
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function on_outro(callback) {
        outros.callbacks.push(callback);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                $$.fragment.l(children(options.target));
            }
            else {
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Message.svelte generated by Svelte v3.4.4 */

    const file = "src\\Message.svelte";

    // (42:0) {#if disabled}
    function create_if_block(ctx) {
    	var span;

    	return {
    		c: function create() {
    			span = element("span");
    			span.textContent = "(message too long)";
    			span.className = "alert svelte-1dwmje5";
    			add_location(span, file, 42, 2, 908);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var input, t0, br0, t1, textarea, t2, br1, t3, button, t4, t5, span, t6, t7, if_block_anchor, dispose;

    	var if_block = (ctx.disabled) && create_if_block();

    	return {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			button = element("button");
    			t4 = text("send");
    			t5 = space();
    			span = element("span");
    			t6 = text(ctx.nbCaracters);
    			t7 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			input.className = "text svelte-1dwmje5";
    			attr(input, "type", "text");
    			add_location(input, file, 35, 0, 639);
    			add_location(br0, file, 36, 0, 694);
    			textarea.cols = "50";
    			textarea.rows = "5";
    			add_location(textarea, file, 37, 0, 701);
    			add_location(br1, file, 38, 0, 754);
    			button.disabled = ctx.disabled;
    			add_location(button, file, 39, 0, 761);
    			span.className = "svelte-1dwmje5";
    			toggle_class(span, "alert", ctx.nbCaracters > maxLength);
    			add_location(span, file, 40, 0, 826);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(textarea, "input", ctx.textarea_input_handler),
    				listen(button, "click", ctx.saveMessage)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, input, anchor);

    			input.value = ctx.author;

    			insert(target, t0, anchor);
    			insert(target, br0, anchor);
    			insert(target, t1, anchor);
    			insert(target, textarea, anchor);

    			textarea.value = ctx.message;

    			insert(target, t2, anchor);
    			insert(target, br1, anchor);
    			insert(target, t3, anchor);
    			insert(target, button, anchor);
    			append(button, t4);
    			insert(target, t5, anchor);
    			insert(target, span, anchor);
    			append(span, t6);
    			insert(target, t7, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.author && (input.value !== ctx.author)) input.value = ctx.author;
    			if (changed.message) textarea.value = ctx.message;

    			if (changed.disabled) {
    				button.disabled = ctx.disabled;
    			}

    			if (changed.nbCaracters) {
    				set_data(t6, ctx.nbCaracters);
    			}

    			if ((changed.nbCaracters || changed.maxLength)) {
    				toggle_class(span, "alert", ctx.nbCaracters > maxLength);
    			}

    			if (ctx.disabled) {
    				if (!if_block) {
    					if_block = create_if_block();
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input);
    				detach(t0);
    				detach(br0);
    				detach(t1);
    				detach(textarea);
    				detach(t2);
    				detach(br1);
    				detach(t3);
    				detach(button);
    				detach(t5);
    				detach(span);
    				detach(t7);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    let maxLength = 24;

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

      let author = "";
      let message = "";

      function saveMessage() {
        const newMessage = {
          id: Date.now(),
          text: message,
          author: author ||'anonymous',
          date: new Date()
        };
        console.log("newMessage", newMessage);
        dispatch("message", newMessage);
        $$invalidate('message', message = "");
        $$invalidate('author', author = "");
      }

    	function input_input_handler() {
    		author = this.value;
    		$$invalidate('author', author);
    	}

    	function textarea_input_handler() {
    		message = this.value;
    		$$invalidate('message', message);
    	}

    	let nbCaracters, disabled;

    	$$self.$$.update = ($$dirty = { message: 1, maxLength: 1 }) => {
    		if ($$dirty.message) { $$invalidate('nbCaracters', nbCaracters = message.length); }
    		if ($$dirty.message || $$dirty.maxLength) { $$invalidate('disabled', disabled = message.length > maxLength ? true : false); }
    	};

    	return {
    		author,
    		message,
    		saveMessage,
    		nbCaracters,
    		disabled,
    		input_input_handler,
    		textarea_input_handler
    	};
    }

    class Message extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\App.svelte generated by Svelte v3.4.4 */

    const file$1 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.message = list[i];
    	return child_ctx;
    }

    // (38:0) {#if isVisible}
    function create_if_block$1(ctx) {
    	var current;

    	var message_1 = new Message({ $$inline: true });
    	message_1.$on("message", ctx.addMessage);

    	return {
    		c: function create() {
    			message_1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(message_1, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			message_1.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			message_1.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			message_1.$destroy(detaching);
    		}
    	};
    }

    // (43:2) {#each messages as message}
    function create_each_block(ctx) {
    	var div0, t0, t1_value = ctx.message.author, t1, t2, t3_value = ctx.formatter.format(ctx.message.date), t3, t4, div1, t5_value = ctx.message.text, t5, t6, hr;

    	return {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("By ");
    			t1 = text(t1_value);
    			t2 = text(" on ");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			hr = element("hr");
    			div0.className = "author svelte-n5v5ti";
    			add_location(div0, file$1, 43, 4, 896);
    			add_location(div1, file$1, 46, 4, 994);
    			add_location(hr, file$1, 47, 4, 1026);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, t0);
    			append(div0, t1);
    			append(div0, t2);
    			append(div0, t3);
    			insert(target, t4, anchor);
    			insert(target, div1, anchor);
    			append(div1, t5);
    			insert(target, t6, anchor);
    			insert(target, hr, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.messages) && t1_value !== (t1_value = ctx.message.author)) {
    				set_data(t1, t1_value);
    			}

    			if ((changed.messages) && t3_value !== (t3_value = ctx.formatter.format(ctx.message.date))) {
    				set_data(t3, t3_value);
    			}

    			if ((changed.messages) && t5_value !== (t5_value = ctx.message.text)) {
    				set_data(t5, t5_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t4);
    				detach(div1);
    				detach(t6);
    				detach(hr);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var button, t0_value = ctx.isVisible ? 'hide' : 'show', t0, br, t1, t2, div, h2, t4, current, dispose;

    	var if_block = (ctx.isVisible) && create_if_block$1(ctx);

    	var each_value = ctx.messages;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			br = element("br");
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Messages";
    			t4 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(button, file$1, 36, 0, 709);
    			add_location(br, file$1, 36, 64, 773);
    			add_location(h2, file$1, 41, 2, 844);
    			add_location(div, file$1, 40, 0, 836);
    			dispose = listen(button, "click", ctx.toggle);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			insert(target, br, anchor);
    			insert(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t2, anchor);
    			insert(target, div, anchor);
    			append(div, h2);
    			append(div, t4);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.isVisible) && t0_value !== (t0_value = ctx.isVisible ? 'hide' : 'show')) {
    				set_data(t0, t0_value);
    			}

    			if (ctx.isVisible) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					if_block.i(1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.i(1);
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				group_outros();
    				on_outro(() => {
    					if_block.d(1);
    					if_block = null;
    				});

    				if_block.o(1);
    				check_outros();
    			}

    			if (changed.messages || changed.formatter) {
    				each_value = ctx.messages;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (if_block) if_block.i();
    			current = true;
    		},

    		o: function outro(local) {
    			if (if_block) if_block.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    				detach(br);
    				detach(t1);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(t2);
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let messages = [];
    	let isVisible = true;

      function addMessage(event) {
        console.log(event);
        $$invalidate('messages', messages = [event.detail, ...messages]);
      }

      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
    	};
    	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
    	const formatter = new Intl.DateTimeFormat("en-US", options);
    	
    	function toggle() {
    		$$invalidate('isVisible', isVisible = !isVisible);
    	}

    	const writable_props = ['name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	return {
    		name,
    		messages,
    		isVisible,
    		addMessage,
    		formatter,
    		toggle
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["name"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Switter'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
