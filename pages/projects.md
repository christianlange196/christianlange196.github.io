---
layout: page.html
title: Projects
description: Selected technical projects from optics, nanofabrication, and lab automation work.
permalink: /projects/
---
## Selected Projects

<div class="projects-grid">
{% for project in collections.projects reversed %}
  {% render "card-project.html", project: project %}
{% endfor %}
</div>
