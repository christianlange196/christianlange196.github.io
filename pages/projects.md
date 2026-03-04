---
layout: page.html
title: Projects
description: Detailed project documentation and engineering case studies.
permalink: /projects/
---
<div class="projects-grid">
  {% for project in collections.projects | reverse %}
    {% render "card-project.html", project: project %}
  {% endfor %}
</div>

