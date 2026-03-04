---
layout: page
title: Projects
description: Detailed project documentation and engineering case studies.
permalink: /projects/
---
<div class="projects-grid">
  {% assign sorted_projects = site.projects | sort: "date" | reverse %}
  {% for project in sorted_projects %}
    {% include card-project.html project=project %}
  {% endfor %}
</div>
