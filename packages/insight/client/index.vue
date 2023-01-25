<template>
  <k-layout main="darker">
    <div ref="root" :class="{ insight: true, 'has-highlight': tooltip.active }">
      <svg
        ref="svg"
        id="couple"
        :width="width"
        :height="height"
        :viewBox="`-${width / 2} -${height / 2} ${width} ${height}`"
      >
        <g class="links">
          <g class="link" v-for="(link, index) in links" :key="index" :class="{ highlight: subgraph.links.has(link) }">
            <line
              :x1="link.source.x"
              :y1="link.source.y"
              :x2="link.target.x"
              :y2="link.target.y"
              class="shadow"
              @mouseenter.stop.prevent="onMouseEnterLink(link, $event)"
              @mouseleave.stop.prevent="onMouseLeaveLink(link, $event)"
            />
            <line
              :x1="link.source.x"
              :y1="link.source.y"
              :x2="link.target.x"
              :y2="link.target.y"
              :class="link.type"
            />
          </g>
        </g>
        <g class="nodes">
          <g class="node"
            v-for="(node, index) in nodes" :key="index"
            :class="{ highlight: subgraph.nodes.has(node) }"
          >
            <circle
              :r="fNode === node ? 12 : 9"
              :cx="node.x"
              :cy="node.y"
              @mouseenter.stop.prevent="onMouseEnterNode(node, $event)"
              @mouseleave.stop.prevent="onMouseLeaveNode(node, $event)"
              @mousedown.stop.prevent="onDragStart(node, $event)"
              @touchstart.stop.prevent="onDragStart(node, $event)"
            />
          </g>
        </g>
      </svg>
      <transition name="fade">
        <div class="tooltip" v-show="tooltip.active" :style="tooltip.style">
          <div v-for="(line, index) of tooltip.content.split('\n')" :key="index">{{ line }}</div>
        </div>
      </transition>
    </div>
  </k-layout>
</template>

<script lang="ts" setup>

import { onMounted, ref, computed, watch, reactive } from 'vue'
import { store } from '@koishijs/client'
import Insight from '@koishijs/plugin-insight'
import * as d3 from 'd3-force'
import { useTooltip, getEventPoint } from './tooltip'
import { useElementSize, useEventListener } from '@vueuse/core'

const root = ref<HTMLElement>()
const { width, height } = useElementSize(root)

const tooltip = useTooltip()
const dragged = ref<Node>(null)
const fNode = ref<Node>(null) 
const fLink = ref<Link>(null) 

interface Node extends Insight.Node, d3.SimulationNodeDatum {
  lastX?: number
  lastY?: number
  active?: boolean
}

interface Link extends Omit<Insight.Link, 'source' | 'target'>, d3.SimulationLinkDatum<Node> {
  source: Node
  target: Node
}

const nodes = reactive<Node[]>(store.insight.nodes as any)
const links = computed<Link[]>(() => store.insight.edges as any)

const forceLink = d3
  .forceLink<Node, Link>(links.value)
  .id(node => node.uid)
  .distance(100)

const simulation = d3
  .forceSimulation(nodes)
  .force('link', forceLink)
  .force('charge', d3.forceManyBody().strength(-200))
  .force('x', d3.forceX().strength(0.05))
  .force('y', d3.forceY().strength(0.05))
  .stop()

watch(() => store.insight, (value) => {
  if (!value) return
  nodes.slice().forEach((source, index) => {
    const target = value.nodes.find(n => n.uid === source.uid)
    if (!target) nodes.splice(index, 1)
  })
  for (const node of value.nodes) {
    const source = nodes.find(n => n.uid === node.uid)
    if (source) {
      Object.assign(source, node)
    } else {
      nodes.push(node)
    }
  }
  simulation.nodes(nodes)
  forceLink.links(value.edges as any)
  simulation.alpha(0.3).restart()
})

const ticks = 1000
const alphaMin = 0.001

onMounted(() => {
  simulation
    .alpha(1)
    .alphaMin(alphaMin)
    .alphaDecay(1 - Math.pow(alphaMin, 1 / ticks))
    .restart()
})

useEventListener('mousemove', onDragMove)
useEventListener('touchmove', onDragMove)
useEventListener('mouseup', onDragEnd)
useEventListener('touchend', onDragEnd)

function onMouseEnterNode(node: Node, event: MouseEvent) {
  fNode.value = node
  tooltip.activate('插件：' + node.name, event)
}

function onMouseLeaveNode(node: Node, event: MouseEvent) {
  if (dragged.value === node) return
  fNode.value = null
  tooltip.deactivate(300)
}

function onMouseEnterLink(link: Link, event: MouseEvent) {
  fLink.value = link
  const type = link.type === 'dashed' ? '依赖' : '调用'
  const text = `${type}：${link.source.name} → ${link.target.name}`
  tooltip.activate(text, event)
}

function onMouseLeaveLink(link: Link, event: MouseEvent) {
  fLink.value = null
  tooltip.deactivate(300)
}

function onDragStart(node: Node, event: MouseEvent | TouchEvent) {
  dragged.value = node
  simulation.alphaTarget(0.3).restart()
  const point = getEventPoint(event)
  node.lastX = point.clientX
  node.lastY = point.clientY
  node.fx = node.x
  node.fy = node.y
}

function onDragMove(event: MouseEvent | TouchEvent) {
  const node = dragged.value
  if (!node) return
  const point = getEventPoint(event)
  node.fx += point.clientX - node.lastX
  node.fy += point.clientY - node.lastY
  node.lastX = point.clientX
  node.lastY = point.clientY
  // const dist2 = node.fx ** 2 + node.fy ** 2
  // if (dist2 > this.DRAGGABLE_RADIUS ** 2) {
  //   const scale = this.DRAGGABLE_RADIUS / Math.sqrt(dist2)
  //   node.fx *= scale
  //   node.fy *= scale
  // }
}

function onDragEnd(event: MouseEvent | TouchEvent) {
  simulation.alphaTarget(0)
  const node = dragged.value
  if (!node) return
  node.fx = null
  node.fy = null
  fNode.value = null
  dragged.value = null
}

interface Graph {
  nodes: Set<Node>
  links: Set<Link>
}

const subgraph = computed<Graph>(() => {
  if (fLink.value) {
    return {
      nodes: new Set([fLink.value.source, fLink.value.target]),
      links: new Set([fLink.value]),
    }
  }
  if (!fNode.value) return { nodes: new Set(), links: new Set() }
  const g1: Graph = {
    nodes: new Set([fNode.value]),
    links: new Set(),
  }
  let flag = true
  while (flag) {
    flag = false
    for (const link of links.value) {
      if (g1.links.has(link) || link.type !== 'solid') continue
      if (g1.nodes.has(link.source) && !g1.nodes.has(link.target)) {
        g1.nodes.add(link.target)
        g1.links.add(link)
        flag = true
      }
    }
  }
  const g2: Graph = {
    nodes: new Set([fNode.value]),
    links: new Set(),
  }
  flag = true
  while (flag) {
    flag = false
    for (const link of links.value) {
      if (g2.links.has(link) || link.type !== 'solid') continue
      if (g2.nodes.has(link.target) && !g2.nodes.has(link.source)) {
        g2.nodes.add(link.source)
        g2.links.add(link)
        flag = true
      }
    }
  }
  return {
    nodes: new Set([...g1.nodes, ...g2.nodes]),
    links: new Set([...g1.links, ...g2.links]),
  }
})

</script>

<style lang="scss" scoped>

.insight {
  width: 100%;
  height: 100%;
}

g.node {
  circle {
    stroke: var(--page-bg);
    stroke-opacity: 1;
    stroke-width: 2;
    cursor: pointer;
    fill: var(--fg3);
    transition: r 0.3s ease, fill 0.3s ease, stroke 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      fill: var(--active);
    }
  }

  .has-highlight &:not(.highlight) circle {
    fill: var(--bg4);
  }
}

g.link {
  line {
    transition: 0.3s ease;
    &:hover {
      stroke-width: 5;
    }
    &.dashed {
      stroke-dasharray: 6 6;
    }
    &.shadow {
      stroke: transparent;
      stroke-width: 6;
      cursor: pointer;
    }
    &:not(.shadow) {
      stroke: var(--fg3);
      stroke-opacity: 0.3;
      stroke-width: 3;
      pointer-events: none;
    }
  }

  .has-highlight &:not(.highlight) line:not(.shadow) {
    stroke-opacity: 0.1;
  }
}

.has-highlight g.links {
  g.highlight {
    stroke: var(--primary);
  }
}

.tooltip {
  position: fixed;
  pointer-events: none;
  user-select: none;
  padding: 4px 8px;
  transition: 0.3s ease;

  &::after {
    z-index: -1;
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 6px;
    background-color: var(--card-bg);
    opacity: 0.6;
    transition: 0.3s ease;
  }

  &.fade-enter-from, &.fade-leave-to {
    opacity: 0;
  }
}

</style>
