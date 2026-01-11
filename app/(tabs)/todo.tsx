import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    FlatList,
} from 'react-native';
import { TodoItem } from '@/types';
import { StorageService } from '@/services/storage-service';
import { TodoItemCard } from '@/components/todo-item-card';
import { AddTodoModal } from '@/components/add-todo-modal';
import { FloatingActionButton } from '@/components/floating-action-button';
import { EmptyState } from '@/components/empty-state';
import { Colors } from '@/constants/theme';

export default function TodoScreen() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        try {
            const loadedTodos = await StorageService.loadTodos();
            setTodos(loadedTodos);
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    };

    const handleAddTodo = () => {
        setModalVisible(true);
    };

    const handleSaveTodo = async (todoData: { text: string }) => {
        try {
            const newTodo: TodoItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                text: todoData.text,
                completed: false,
                createdAt: new Date().toISOString(),
            };

            await StorageService.addTodo(newTodo);
            setTodos(prevTodos => [...prevTodos, newTodo]);
            setModalVisible(false);
        } catch (error) {
            console.error('Error saving todo:', error);
        }
    };

    const handleToggleComplete = async (todoId: string) => {
        try {
            const todo = todos.find(t => t.id === todoId);
            if (!todo) return;

            const updatedTodo: TodoItem = {
                ...todo,
                completed: !todo.completed,
            };

            await StorageService.updateTodo(updatedTodo);
            setTodos(prevTodos =>
                prevTodos.map(t => (t.id === todoId ? updatedTodo : t))
            );
        } catch (error) {
            console.error('Error toggling todo completion:', error);
        }
    };

    const handleDeleteTodo = async (todoId: string) => {
        try {
            await StorageService.deleteTodo(todoId);
            setTodos(prevTodos => prevTodos.filter(t => t.id !== todoId));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const activeTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);
    const sortedTodos = [...activeTodos, ...completedTodos];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>To-Do List</Text>
                        <Text style={styles.headerSubtitle}>
                            {activeTodos.length} active • {completedTodos.length} completed
                        </Text>
                    </View>
                </View>

                {/* Todo List */}
                {sortedTodos.length === 0 ? (
                    <EmptyState
                        icon="checkmark-done-circle-outline"
                        message="No to-do items yet"
                        submessage="Tap the + button to add your first item"
                    />
                ) : (
                    <FlatList
                        data={sortedTodos}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TodoItemCard
                                todo={item}
                                onToggleComplete={handleToggleComplete}
                                onDelete={handleDeleteTodo}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* FAB */}
                <FloatingActionButton onPress={handleAddTodo} />

                {/* Add Todo Modal */}
                <AddTodoModal
                    visible={modalVisible}
                    onSave={handleSaveTodo}
                    onCancel={() => setModalVisible(false)}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
});
