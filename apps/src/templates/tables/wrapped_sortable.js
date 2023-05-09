import React from 'react';
import * as sort from 'sortabular';
import FontAwesome from '../FontAwesome';

/**
 * Sortable transform that wraps a Reactabular transform generated by sort.sort so that
 * instead of applying sort classes to the header cell it adds the appropriate FontAwesome
 * component to the cell contents.
 * @param {function(): object[]} getSortingColumns
 * @param {function(number): object} onSort
 * @param {object} styles - optional styles to apply to the sort icons, in states {default, sortAsc, sortDesc}
 *                          and the container div {container}
 * @returns {function(string, object): object} a new cell transform function
 * @see http://reactabular.js.org/#/column-definition/transforms
 * @see https://github.com/reactabular/reactabular/blob/master/packages/reactabular-sort/src/sort.js
 */
function wrappedSortable(getSortingColumns, onSort, styles = {}) {
  const basicSortable = sort.sort({getSortingColumns, onSort});

  return (label, columnInfo) => {
    const {className: newClassName, ...newProps} = basicSortable(
      label,
      columnInfo
    );

    // Detect new classes applied by sort transform: sort-none, sort-asc, sort-desc
    // Instead of applying those classes, add different FontAwesome icons
    let sortIcon = (
      <FontAwesome icon="sort" className="fa-fw" style={styles.default} />
    );
    if (/sort-asc/.test(newClassName)) {
      sortIcon = (
        <FontAwesome icon="sort-asc" className="fa-fw" style={styles.sortAsc} />
      );
    } else if (/sort-desc/.test(newClassName)) {
      sortIcon = (
        <FontAwesome
          icon="sort-desc"
          className="fa-fw"
          style={styles.sortDesc}
        />
      );
    }

    // Disable wrapping on the sorting icon to ensure that the header will
    // never wrap such that the sorting icon is on a row all on its own.
    //
    // Note that we could apply this style to the whole header cell, but that
    // would prevent any wrapping from happening at all; because we want to
    // allow for the possibility of long header names that _should_ wrap, this
    // provides a nice compromise.
    const sortIconSpanStyle = {whiteSpace: 'nowrap'};

    return {
      ...newProps,
      style: Object.assign({}, {cursor: 'pointer'}),
      children: (
        <span style={styles.container}>
          <span key="icon" style={sortIconSpanStyle}>
            {sortIcon}
          </span>
          <span key="label">{label}</span>
        </span>
      ),
    };
  };
}
export default wrappedSortable;
