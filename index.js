/*global serialiseChildren*/

var HTML_NS =   "http://www.w3.org/1999/xhtml"
,   MATH_NS =   "http://www.w3.org/1998/Math/MathML"
,   SVG_NS =    "http://www.w3.org/2000/svg"
,   XLINK_NS =  "http://www.w3.org/1999/xlink"
,   XML_NS =    "http://www.w3.org/XML/1998/namespace"
,   XMLNS_NS =  "http://www.w3.org/2000/xmlns/"
,   util = require("util")
,   selfClosing = "area base basefont bgsound br col embed frame hr img input " +
                  "keygen link menuitem meta param source track wbr".split(" ")
;

function isHTMLElement (el, names) {
    if (!util.isArray(names)) names = [names];
    return el.namespaceURI === HTML_NS && names.indexOf(el.localName.toLowerCase());
}

function escape (value, attrMode) {
    value = value.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;");
    if (attrMode) return value.replace(/"/g, "&quot;");
    else          return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function serialiseNode (node, parent) {
    var nt = node.nodeType;
    if (nt === 1) { // Element
        var tagName
        ,   s = ""
        ,   ns = node.namespaceURI
        ;
        if (ns === HTML_NS || ns === MATH_NS || ns === SVG_NS) tagName = node.localName;
        else tagName = node.tagName;
        s += "<" + tagName;
        for (var i = 0, n = node.attributes.length; i < n; i++) {
            var attr = node.attributes[i]
            ,   ns = attr.namespaceURI
            ;
            s += " ";
            if (!ns) s += attr.localName;
            else if (ns === XML_NS) s += "xml:" + attr.localName;
            else if (ns === XMLNS_NS && attr.localName === "xmlns") s += "xmlns";
            else if (ns === XMLNS_NS) s += "xmlns:" + attr.localName;
            else if (ns === XLINK_NS) s += "xlink:" + attr.localName;
            else s += attr.name;
            s += '="' + escape(attr.value, true) + '"';
        }
        s += ">";
        if (isHTMLElement(node, selfClosing)) return s;
        if (isHTMLElement(node, ["pre", "textarea", "listing"]) &&
            node.childNodes.length &&
            node.childNodes[0].nodeType === 3 &&
            node.childNodes[0].data.charAt(0) === "\u000a") s += "\u000a";
        return s + serialiseChildren(node) + "</" + tagName + ">";
    }
    else if (nt === 3) { // Text
        // we always consider scripting to be enabled (for noscript)
        if (isHTMLElement(parent, "style script xmp iframe noembed noframes noscript plaintext".split(" ")))
            return node.data;
        else return escape(node.data);
    }
    else if (nt === 8) { // Comment
        return "<!--" + node.data + "-->";
    }
    else if (nt === 7) { // PI
        return "<?" + node.target + " " + node.data + ">";
    }
    else if (nt === 10) { // DocumentType
        return "<!DOCTYPE " + node.name + ">";
    }
    else {
        throw new Error("Unknown node type: " + nt);
    }
}

function serialiseChildren (node) {
    var s = "";
    if (isHTMLElement("template")) return serialiseChildren(node.content);
    for (var i = 0, n = node.childNodes.length; i < n; i++) s += serialiseNode(node.childNodes[i], node);
    return s;
}


exports.innerHTML = function (node) {
    var nt = node.nodeType;
    if (nt !== 1 && nt !== 9 && nt !== 11)
        throw new Error("Only Element, Document, and DocumentFragment nodes are supported");
    return serialiseChildren(node);
};

exports.outerHTML = function (node) {
    var nt = node.nodeType;
    if (nt !== 1 && nt !== 9 && nt !== 11)
        throw new Error("Only Element, Document, and DocumentFragment nodes are supported");
    return serialiseNode(node);
};

