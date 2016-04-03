modstyle
========

Proof of concept plugin for how style scoping can be implemented for templates.

This plugin uses the path of the template/style files and before handing them back to the developer, a data attribute is injected into to them which contains the path of the template/style without the extension. So for the developer, regardless of what they type into their HTML/CSS, it will always be scoped.
