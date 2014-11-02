"use strict";


module.exports = {
  removeChildNodes: function(node) {
    if (! node) {
      console.warn('node is wrong.');
      return;
    }

    while (node.firstChild) {
      node.removeChild(node.firstChild);  
    }
  },
  replaceHtml: function(node, html) {
    this.removeChildNodes(node);
    this.html(node, html);
  },
  appendHtml: function(node, html) {
    this.html(node, html, 'beforeend');
  },
  html: function(node, html, pos) {
    pos = pos || 'beforeend';

    if (! html instanceof String) {
      console.warn('html is not string.');
      return;
    }

    if (! node) {
      console.warn('node is wrong.');
      return;
    }

    node.insertAdjacentHTML(pos, html);
  },
  isNode: function(obj) {
    return (
      typeof Node === "object" ? obj instanceof Node : 
      obj && typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName==="string"
    );
  }
};