/**
 * Easiest way to sort your tables
 *
 * For further information and documentation go to https://github.com/dan-lee/jquery-easyTableSort
 *
 * Copyright (c) 2012 Daniel Lehr <daniellehr@gmx.de>, agixo <http://agixo.de>
 * Released under the MIT license.
 * See MIT-LICENSE.txt
 */

(function($) {
  var defaults = {
    /**
     * Changes the prefix of the used css classes in the plugin.
     * These classes will be appended to the head columns to determine which state they were.
     * If the prefix 'sort' is already used in your project you can change it here
     */
    prefix: 'sort',

    /**
     * The sort order in which your table entries will be sorted first.
     * Possible entries:
     *  - asc: Ascending order (a-z, 0-9, ...)
     *  - desc: Descending order (z-a, 9-0, ...)
     */
    order: 'asc',

    /**
     * Adds the possibility to sort the table entries when the table is created.
     * Accepts index values of table head column (zero-based).
     */
    autoSort: null,

    /**
     * You can add your own sort methods here
     */
    sortMethods: {
      numeric: function(a, b) {
        return (parseInt(a) - parseInt(b));
      },
      float: function(a, b) {
        return (parseFloat(a) - parseFloat(b));
      },
      alphabetical: function(a, b) {
        return (a.toLowerCase() > b.toLowerCase()) ? 1 : -1;
      },
      date: function(a, b) {
        a = new Date(a);
        b = new Date(b);

        if (priv.helper.isDate(a) && priv.helper.isDate(b)) {
          return (a > b) ? 1 : -1;
        }
        return 0;
      }
    },

    /**
     * If you have no control over the table structure and it lacks of a table head, then set this value to true
     * and the first row of your table will be treatened as table head column
     */
    fixTableHead: false,

    /**
     * If you want exclude head columns
     */
    excludeSortColumns: [],

    /**
     *
     */
    onBeforeSort: function () {},

    /**
     *
     */
    onAfterSort: function () {}
  };

  function Plugin(element, options) {
    priv.init(element, options);
  }

  var priv = {
    options: {},

    init: function(element, options) {
      this.options = $.extend(true, {}, defaults, options);

      this.table = element;
      this.$table = $(element);

      if (this.options.fixTableHead === true) {
        this.fixTableHead();
      }

      this.rows = this.$table.find('tbody').children();
      this.cols = this.$table.find('thead').find('th');

      this.sortOrder = new Array(this.cols.length);
      this.sortModes = ['asc', 'desc'];

      var self = this;
      this.cols.on('click', function() {
        self.sort(this);
      });

      this.options.prefix += (this.options.prefix.slice(-1) !== '-' ? '-' : '');

      if (this.options.autoSort !== null) {
        this.cols.eq(parseInt(this.options.autoSort)).trigger('click');
      }
    },

    fixTableHead: function() {
      var thead = $('<thead></thead>');
      var child = this.$table.find('tr').first().remove();
      this.$table.prepend(thead.append(child));
    },

    toggleOrder: function(element, columnIndex) {
      var currentOrder = this.sortOrder[columnIndex];
      var newKey, oldKey;

      if (typeof currentOrder === 'undefined') {
        newKey = this.helper.getIndexByValue(this.sortModes, this.options.order);
        this.sortOrder[columnIndex] = this.sortModes[newKey];
        $(element).addClass(this.options.prefix + this.sortModes[newKey]);
      } else {
        oldKey = this.helper.getIndexByValue(this.sortModes, currentOrder);
        // little trick for toggling of two values:
        // 1. cast to bool, 2. negate the value, 3. cast back to int
        newKey = +!oldKey;
        this.sortOrder[columnIndex] = this.sortModes[newKey];

        $(element).removeClass(this.options.prefix + this.sortModes[oldKey]).addClass(this.options.prefix + this.sortModes[newKey]);
      }
    },

    isExcluded: function(current) {
      var len = this.cols.length;

      // is the clicked column an excluded one? if so: abort
      var abort = false;
      $.each(this.options.excludeSortColumns, function(i, val) {
        val += val < 0 ? len : 0;

        if (current === val) {
          abort = true;
        }
      });
      return abort;
    },

    sortBy: function(method, columnIndex) {
      this.rows.sort(function(a, b) {
        a = $(a).find('td').eq(columnIndex).text();
        b = $(b).find('td').eq(columnIndex).text();

        if (!a || !b) {
          return 0;
        }

        return priv.options.sortMethods[method](a, b) * (priv.sortOrder[columnIndex] === priv.sortModes[0] ? 1 : -1);
      });
    },

    sort: function(element) {
      var columnIndex = this.cols.index(element);

      // check if there's a class starting with the given prefix
      if (new RegExp('\\b' + this.options.prefix).test(element.className)) {
        var method = element.className.match(new RegExp(this.options.prefix + '([^\\s]+)'))[1];

        if (this.options.sortMethods.hasOwnProperty(method)) {
          // is the clicked column an excluded one? if so: abort
          if (this.isExcluded(columnIndex)) {
            return false;
          }
          this.options.onBeforeSort.call($(element), columnIndex);

          this.toggleOrder(element, columnIndex);
          this.sortBy(method, columnIndex);
          this.render();

          // call after sort hook
          this.options.onAfterSort.call($(element), columnIndex);

          return true;
        } else console.error('No suitable sort method found.');
      }
      return false;
    },

    render: function() {
      $.each(this.rows, function(i, val) {
        priv.$table.append(val);
      });
    },

    helper: {
      isDate: function(d) {
        // http://stackoverflow.com/a/1353711/612202
        if (Object.prototype.toString.call(d) === '[object Date]') {
          return !isNaN(d.getTime());
        } else {
          return false;
        }
      },

      getIndexByValue: function(array, value) {
        var result = false;
        $.each(array, function(index, item) {
          if (value === item) {
            result = index;
            return false;
          }
        });
        return result;
      }
    }
  };


  $.fn.simpleTableSort = function(options) {
    return this.each(function() {
      if (!$.data(this, 'plugin_simpleTableSort')) {
        $.data(this, 'plugin_simpleTableSort', new Plugin(this, options));
      }
    });
  };
})(jQuery);
