<template>
  <k-layout main="darker">
    <div ref="root" :class="{ insight: true, 'has-highlight': tooltip.active }">
      <svg
        ref="svg"
        id="couple"
        v-bind="svgAttrs"
      >
        <g class="links">
          <link-view
            v-for="(link, index) in links" :key="index"
            :link="link"
            :class="{ highlight: subgraph.links.has(link) }"
            @mouseenter="onMouseEnterLink"
            @mouseleave="onMouseLeaveLink"
          ></link-view>
        </g>
        <g class="nodes">
          <node-view
            v-for="(node, index) in nodes" :key="index"
            :class="{ highlight: subgraph.nodes.has(node) }"
            :node="node" :is-active="node === fNode"
            @mouseenter.stop.prevent="onMouseEnterNode(node, $event)"
            @mouseleave.stop.prevent="onMouseLeaveNode(node, $event)"
            @mousedown.stop.prevent="onDragStart(node, $event)"
            @touchstart.stop.prevent="onDragStart(node, $event)"
          ></node-view>
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
import { useTooltip, getEventPoint } from './tooltip'
import { useElementSize, useEventListener, watchThrottled } from '@vueuse/core'
import { Node, Link } from './utils'
import * as d3 from 'd3-force'
import LinkView from './link.vue'
import NodeView from './node.vue'

const root = ref<HTMLElement>()
const { width, height } = useElementSize(root)

const tooltip = useTooltip()
const dragged = ref<Node>(null)
const fNode = ref<Node>(null) 
const fLink = ref<Link>(null) 

const nodes = reactive<Node[]>(store.insight.nodes as any)
const links = computed<Link[]>(() => store.insight.edges as any)

const svgAttrs = computed(() => {
  // fix all the nodes in the root element
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x)
    maxY = Math.max(maxY, node.y)
  }
  const vpWidth = maxX - minX + 200
  const vpHeight = maxY - minY + 200
  let transform: string
  if (width.value / vpWidth > height.value / vpHeight) {
    const scale = height.value / vpHeight
    const realWidth = vpWidth * scale
    transform = `scale(${scale}) translateX(${(width.value - realWidth) / 2 / scale}px)`
  } else {
    const scale = width.value / vpWidth
    const realHeight = vpHeight * scale
    transform = `scale(${scale}) translateY(${(height.value - realHeight) / 2 / scale}px)`
  }
  return {
    width: vpWidth + 'px',
    height: vpHeight + 'px',
    viewBox: `${minX - 100} ${minY - 100} ${vpWidth} ${vpHeight}`,
    style: {
      transform,
      transformOrigin: 'top left',
    },
  }
})

function weight(link: Link) {
  return link.type === 'solid' ? 1 : 0.2
}

function degree(node: Node) {
  let count = 0
  for (const link of links.value) {
    if (link.source !== node && link.target !== node) continue
    count += weight(link)
  }
  return count
}

const forceLink = d3.forceLink<Node, Link>(links.value)
  .id(node => node.uid)
  .strength((link) => {
    return weight(link) / Math.min(degree(link.source), degree(link.target))
  })

const forceManyBody = d3.forceManyBody<Node>()
const forceX = d3.forceX<Node>()
const forceY = d3.forceY<Node>()

const simulation = d3
  .forceSimulation(nodes)
  .force('link', forceLink)
  .force('charge', forceManyBody)
  .force('x', forceX)
  .force('y', forceY)
  .stop()

function resetForce() {
  forceLink.distance(100) // (config.value.link.distance)
  forceManyBody.strength(-200) // (-config.value.strengh.repulsion)
  forceX.strength(0.1 * (height.value / (width.value + height.value) || 1)) // (config.value.strengh.centering)
  forceY.strength(0.1 * (width.value / (width.value + height.value) || 1)) // (config.value.strengh.centering)

  const alphaMin = Math.exp(-6) // (-config.value.simulation.logMin)
  const alphaTicks = Math.exp(7) // (config.value.simulation.logTicks)
  simulation
    .alpha(1) // config.value.simulation.initial)
    .alphaMin(alphaMin)
    .alphaDecay(1 - Math.pow(alphaMin, 1 / alphaTicks))
}

onMounted(() => {
  resetForce()
  simulation.restart()

  watchThrottled(() => [
    // config.value.link.distance,
    // config.value.cluster,
    // config.value.strengh,
    // config.value.simulation,
    width.value,
    height.value,
  ], () => {
    resetForce()
    simulation.restart()
  }, { deep: true, throttle: 100, trailing: true })
})

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

useEventListener('mousemove', onDragMove)
useEventListener('touchmove', onDragMove)
useEventListener('mouseup', onDragEnd)
useEventListener('touchend', onDragEnd)

function onMouseEnterNode(node: Node, event: MouseEvent) {
  fNode.value = node
  const result = ['插件：' + node.name]
  if (node.services) {
    result.push('提供服务：' + node.services.join('，'))
  }
  tooltip.activate(result.join('\n'), event)
}

function onMouseLeaveNode(node: Node, event: MouseEvent) {
  if (dragged.value === node) return
  fNode.value = null
  tooltip.deactivate(300)
}

function onMouseEnterLink(link: Link, event: MouseEvent) {
  fLink.value = link
  const type = link.type === 'dashed' ? '服务' : '调用'
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

const getEmptyGraph = (): Graph => ({ nodes: new Set(), links: new Set() })

const getLinkGraph = (link: Link): Graph => ({
  nodes: new Set([link.source, link.target]),
  links: new Set([link]),
})

const getAncestorGraph = (node: Node): Graph => {
  const graph: Graph = {
    nodes: new Set([node]),
    links: new Set(),
  }
  let flag = true
  while (flag) {
    flag = false
    for (const link of links.value) {
      if (graph.links.has(link)) continue
      if (graph.nodes.has(link.target)) {
        graph.nodes.add(link.source)
        graph.links.add(link)
        flag = true
      }
    }
  }
  return graph
}

const subgraph = computed<Graph>(() => {
  if (fLink.value) return getLinkGraph(fLink.value)
  if (!fNode.value) return getEmptyGraph()
  return getAncestorGraph(fNode.value)
})

</script>

<style lang="scss" scoped>

.insight {
  width: 100%;
  height: 100%;
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
