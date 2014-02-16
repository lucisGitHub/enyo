/*
	Copyright 2014 LG Electronics, Inc.

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/
/**
	_enyo.Repeater_ is a simple control for making lists of items.

	The components of a repeater are copied for each item created, and are
	wrapped	in a control that keeps the state of the item index.

	Example:

		{kind: "Repeater", count: 2, onSetupItem: "setImageSource", components: [
			{kind: "Image"}
		]}

		setImageSource: function(inSender, inEvent) {
			var index = inEvent.index;
			var item = inEvent.item;
			item.$.image.setSrc(this.imageSources[index]);
			return true;
		}

	Be sure to return _true_ from your _onSetupItem_ handler to avoid having
	other event handlers further up the tree try to modify your item control.

	For more information, see the documentation on
	[Lists](building-apps/layout/lists.html) in the Enyo Developer Guide.
*/
enyo.kind({
	name: "enyo.Repeater",
	published: {
		//* Number of items
		count: 0
	},
	events: {
		/**
			Fires when each item is created.

			_inEvent.index_ contains the item's index.

			_inEvent.item_ contains the item control, for decoration.
		*/
		onSetupItem: ""
	},
	create: enyo.inherit(function (sup) {
		return function() {
			sup.apply(this, arguments);
			this.countChanged();
		};
	}),
	//* @protected
	initComponents: enyo.inherit(function (sup) {
		return function() {
			this.itemComponents = this.components || this.kindComponents;
			this.components = this.kindComponents = null;
			sup.apply(this, arguments);
		};
	}),
	countChanged: function() {
		this.build();
	},
	itemAtIndex: function(inIndex) {
		return this.controlAtIndex(inIndex);
	},
	//* @public
	/** Renders the collection of items. This will delete any existing items and
		recreate the repeater if called after the repeater has been rendered.
		This is called automatically when the count property changes. To set the
		count and force a re-render, such as when a data model changes, use
		set("count", newCount, true) where the last parameter forces the change
		handler to be called, even if the count remains the same.
	*/
	build: function() {
		this.destroyClientControls();
		for (var i=0, c; i<this.count; i++) {
			c = this.createComponent({kind: "enyo.OwnerProxy", index: i});
			// do this as a second step so 'c' is the owner of the created components
			c.createComponents(this.itemComponents);
			// invoke user's setup code
			this.doSetupItem({index: i, item: c});
		}
		this.render();
	},
	/**
		Renders a specific item in the collection. This does not destroy the
		item, but just calls the _onSetupItem_ event handler again for it, so
		any state stored in	the item is preserved.
	*/
	renderRow: function(inIndex) {
		var c = this.itemAtIndex(inIndex);
		this.doSetupItem({index: inIndex, item: c});
	}
});

// Sometimes client controls are intermediated with null-controls.
// These overrides reroute events from such controls to the nominal delegate,
// as would happen in the absence of intermediation.
enyo.kind({
	name: "enyo.OwnerProxy",
	tag: null,
	decorateEvent: enyo.inherit(function (sup) {
		return function(inEventName, inEvent, inSender) {
			if (inEvent) {
				// preserve an existing index property.
				if (enyo.exists(inEvent.index)) {
					// if there are nested indices, store all of them in an array
					// but leave the innermost one in the index property
					inEvent.indices = inEvent.indices || [inEvent.index];
					inEvent.indices.push(this.index);
				} else {
					// for a single level, just decorate the index property
					inEvent.index = this.index;
				}
				// update delegate during bubbling to account for proxy
				// by moving the delegate up to the repeater level
				if (inEvent.delegate && inEvent.delegate.owner === this) {
					inEvent.delegate = this.owner;
				}
			}
			sup.apply(this, arguments);
		};
	})
});