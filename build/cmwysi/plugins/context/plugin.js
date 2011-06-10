(function($){
  $.fn.ContextMenu = function(options) {
    this.each(function(index){
      ContextMenu.Create(this,options,index);
    });
  };

  var ContextBase = $("<div/>").addClass("context-menu").css({"display":"none"});
  var ContextMenu = wysiwyg["ContextMenu"] = {
    Menus : [],
    Create : function(element,options,num) {
      var cntxt = this.Menus[this.Menus.length] = $(ContextBase).clone();
      $(cntxt).addClass(options.name);

      $(element).append(cntxt);
      this.AttachTo(element,options);
    },
    AttachTo : function(parent,options) {
      $(parent).find(options.attachTo).bind("mousedown.cmwysi",function(ev){
        if (((options.type=="right")&&(ev.button===2)) ||
            ((options.type=="left")&&(ev.button!==2))) {
          var menu = $(parent).find(".context-menu")[0];
          wysiwyg.ContextMenu.Show(menu,options,ev);
        }
      });
    },
    Show : function(menu,options,ev) {
      var ed = wysiwyg.utils.getEditor(wysiwyg.utils.eventSource(ev));
      var ifrm = $(ed.iframe).closest(".cmwysiFrame").position();
      var clickPos = {top : ev.clientY, left : ev.clientX};
      var src = wysiwyg.utils.eventSource(ev);
      var html = this.Build(menu,options,src);

      $(menu)
        .css({left:(clickPos.left-ifrm.left)+"px",
              top:(clickPos.top-ifrm.top)+"px"})
        .addClass("context-menu").addClass("toolbar-context")
        .html("")
        .append(html)
        .show();
    },
    Hide : function(menu){
      $(menu).hide();
    },
    Build : function(menu,options,src) {
      var ul = $("<ul/>");
      var node = src.nodeName.toLowerCase();
      var li;
      if(options.items["*"]) {
        for(var item in options.items["*"]) {
          li = $("<li/>")
                .html(options.items["*"][item].name)
                .bind("click.cmwysi",function(ev){
                  if (options.items["*"][item].func(src,ev)) {
                    wysiwyg.ContextMenu.Hide(menu);
                  }
                });
          $(ul).append(li);
        }
      }
      if(options.items[node]){
        //console.log(options.items[node]);
      }

      return ul;
    }
  }
})(jQuery);
