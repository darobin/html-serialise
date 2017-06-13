
let HTML_NS =   'http://www.w3.org/1999/xhtml'
  , MATH_NS =   'http://www.w3.org/1998/Math/MathML'
  , SVG_NS =    'http://www.w3.org/2000/svg'
  , XLINK_NS =  'http://www.w3.org/1999/xlink'
  , XML_NS =    'http://www.w3.org/XML/1998/namespace'
  , XMLNS_NS =  'http://www.w3.org/2000/xmlns/'
  , selfClosing = 'area base basefont bgsound br col embed frame hr img input ' +
                  'keygen link menuitem meta param source track wbr'.split(' ')
  , rawTextElement = 'style script xmp iframe noembed noframes noscript plaintext'.split(' ')
  , isHTMLElement = (el, names) => {
      if (!Array.isArray(names)) names = [names];
      return el.namespaceURI === HTML_NS && names.indexOf(el.localName.toLowerCase()) > -1;
    }
  , escape = (value, attrMode) => {
        value = value.replace(/&/g, '&amp;').replace(/\u00a0/g, '&nbsp;');
        if (attrMode) return value.replace(/"/g, '&quot;');
        return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
;

function serialiseNode (node, parent) {
  let nt = node.nodeType;
  if (nt === 1) {
    let tagName
      , s = ''
      , ns = node.namespaceURI
    ;
    if (ns === HTML_NS || ns === MATH_NS || ns === SVG_NS) tagName = node.localName;
    else tagName = node.tagName;
    s += `<${tagName}`;
    Array.from(node.attributes).forEach(attr => {
      let ans = attr.namespaceURI;
      s += ' ';
      if (!ans) s += attr.localName;
      else if (ans === XML_NS) s += `xml:${attr.localName}`;
      else if (ans === XMLNS_NS && attr.localName === 'xmlns') s += 'xmlns';
      else if (ans === XMLNS_NS) s += `xmlns:${attr.localName}`;
      else if (ans === XLINK_NS) s += `xlink:${attr.localName}`;
      else s += attr.name;
      s += `="${escape(attr.value, true)}"`;
    });
    s += '>';
    if (isHTMLElement(node, selfClosing)) return s;
    if (
      isHTMLElement(node, ['pre', 'textarea', 'listing']) &&
      node.childNodes.length &&
      node.childNodes[0].nodeType === 3 &&
      node.childNodes[0].data.charAt(0) === '\u000a'
    ) s += '\u000a';
    return `${s}${serialiseChildren(node)}</${tagName}>`;
  }
  if (nt === 3) {
    // we always consider scripting to be enabled (for noscript)
    if (isHTMLElement(parent, rawTextElement)) return node.data;
    return escape(node.data);
  }
  if (nt === 7) return `<?${node.target} ${node.data}>`;
  if (nt === 8) return `<!--${node.data}-->`;
  if (nt === 9) return serialiseChildren(node);
  if (nt === 10) return `<!DOCTYPE  ${node.name}>`;
  throw new Error('Unknown node type: ' + nt);
}

function serialiseChildren (node) {
  if (isHTMLElement('template')) return serialiseChildren(node.content);
  return Array.from(node.childNodes).map(child => serialiseNode(child, node)).join('');
}


exports.innerHTML = function (node) {
  let nt = node.nodeType;
  if (nt !== 1 && nt !== 9 && nt !== 11) {
    throw new Error('Only Element, Document, and DocumentFragment nodes are supported');
  }
  return serialiseChildren(node);
};

exports.outerHTML = function (node) {
  let nt = node.nodeType;
  if (nt !== 1 && nt !== 9 && nt !== 11) {
    throw new Error('Only Element, Document, and DocumentFragment nodes are supported');
  }
  return serialiseNode(node);
};
