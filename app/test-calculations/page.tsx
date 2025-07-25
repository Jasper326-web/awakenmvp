"use client"

import { useState } from "react"
import { calculateSuccessRate, getUserLevel, getLevelProgress, getLevelInfo } from "@/lib/streak-calculator"

export default function TestCalculations() {
  const [streak, setStreak] = useState(0)

  const successRate = calculateSuccessRate(streak)
  const level = getUserLevel(streak)
  const levelProgress = getLevelProgress(streak)
  const levelInfo = getLevelInfo(streak)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">成功率和等级计算测试</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">连续天数:</label>
        <input
          type="number"
          value={streak}
          onChange={(e) => setStreak(parseInt(e.target.value) || 0)}
          className="border rounded px-3 py-2 w-32"
          min="0"
          max="365"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">成功率计算</h2>
          <div className="space-y-2">
            <p><strong>连续天数:</strong> {streak}</p>
            <p><strong>成功率:</strong> {successRate}%</p>
            <div className="mt-4">
              <h3 className="font-medium mb-2">阶段权重:</h3>
              <ul className="text-sm space-y-1">
                <li>Lv1 (0-7天): 10%</li>
                <li>Lv2 (8-21天): 20%</li>
                <li>Lv3 (22-45天): 30%</li>
                <li>Lv4 (46-90天): 25%</li>
                <li>Lv5 (91-180天): 15%</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">等级计算</h2>
          <div className="space-y-2">
            <p><strong>当前等级:</strong> Lv.{level}</p>
            <p><strong>等级名称:</strong> {levelInfo.levelName}</p>
            <p><strong>等级进度:</strong> {levelProgress}%</p>
            <p><strong>距离下一级:</strong> {levelInfo.daysToNextLevel}天</p>
            <div className="mt-4">
              <h3 className="font-medium mb-2">等级划分:</h3>
              <ul className="text-sm space-y-1">
                <li>Lv1: 0-7天 (初学者)</li>
                <li>Lv2: 8-21天 (坚持者)</li>
                <li>Lv3: 22-45天 (进阶者)</li>
                <li>Lv4: 46-90天 (专家)</li>
                <li>Lv5: 91-180+天 (大师)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">测试用例</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 7, 21, 45, 90, 180].map((testStreak) => (
            <button
              key={testStreak}
              onClick={() => setStreak(testStreak)}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              测试 {testStreak} 天
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 