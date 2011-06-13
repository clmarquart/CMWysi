$(document).ready(function() {
  $("textarea").cmwysi({
    packages : "basic,format,images,table,style,autosave", //,context",
    style : ["../demo/css/template.css"],
    location : "../cmwysi"
  });
});
