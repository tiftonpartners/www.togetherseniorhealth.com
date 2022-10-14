export interface IProps {
    open?: boolean;
    onClose?: () => void;
    onExit?: () => void;
}

export interface IStateElement {
    component: React.ComponentType<any>;
    props: IProps;
}

export interface IState {
    [id: string]: IStateElement;
}

const initialState: IState = {};

export default initialState;
