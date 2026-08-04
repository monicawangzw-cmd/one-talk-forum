'use client';

import React, { useState, useRef } from 'react';
import { Plus, X, Upload, File as FileIcon } from 'lucide-react';
import Modal from './ui/Modal';
import type { User, Attachment } from '@/types';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onPostCreated: () => void;
}

const PROFESSIONAL_FIELDS = ['品质领域', '工程领域', '研发领域', '其他领域'];

export default function CreatePost({ isOpen, onClose, user, onPostCreated }: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'professional' | 'life'>('professional');
  const [subCategory, setSubCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`文件 "${file.name}" 超过5MB限制`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          name: file.name,
          url: reader.result as string,
          size: file.size,
          type: file.type,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (category === 'professional' && !subCategory) {
      setError('请选择专业领域分类');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title, content, category, subCategory, tags, attachments }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发布失败');

      onPostCreated();
      onClose();
      setTitle('');
      setContent('');
      setTags([]);
      setAttachments([]);
      setSubCategory('');
      setCategory('professional');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="发布新帖">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            发布版面
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setCategory('professional'); setSubCategory(''); }}
              className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${
                category === 'professional'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
              }`}
            >
              📚 专业知识
            </button>
            <button
              type="button"
              onClick={() => { setCategory('life'); setSubCategory(''); }}
              className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${
                category === 'life'
                  ? 'bg-pink-600 text-white border-pink-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
              }`}
            >
              🌈 生活服务
            </button>
          </div>
        </div>

        {category === 'professional' && (
          <div className="animate-fade-in-down">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              专业领域分类 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PROFESSIONAL_FIELDS.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setSubCategory(field)}
                  className={`py-2.5 px-4 rounded-lg font-medium transition-all border-2 text-sm ${
                    subCategory === field
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            帖子标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="请输入帖子标题"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            帖子内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="请输入帖子内容"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            附件 <span className="text-gray-400 text-xs">（可选，单个最大5MB）</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-500 transition-all flex flex-col items-center justify-center gap-2"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm">点击上传附件（支持多文件）</span>
          </button>

          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((att, index) => (
                <div key={index} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <FileIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 truncate">{att.name}</span>
                  <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            添加标签 <span className="text-gray-400 text-xs">（最多5个）</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="标签名称，回车添加"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all"
            >
              添加
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {loading ? '发布中...' : '发布帖子'}
        </button>
      </form>
    </Modal>
  );
}